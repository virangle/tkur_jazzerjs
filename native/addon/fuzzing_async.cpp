// Copyright 2022 Code Intelligence GmbH
// Copyright 2026 TKUR contributors
// SPDX-License-Identifier: Apache-2.0
// Derived from pinned Jazzer.js4.0.0; simplified to Promise-only native boundary.
#include "fuzzing_async.h"
#include "shared/libfuzzer.h"
#include "utils.h"
#include <future>
#include <memory>
#include <thread>

namespace {
struct Context {
  explicit Context(Napi::Env env):deferred(Napi::Promise::Deferred::New(env)){}
  std::thread thread;
  Napi::Promise::Deferred deferred;
  // Only the JS event-loop thread accesses this flag.
  bool rejected=false;
  Napi::ObjectReference error;
};
struct Input {
  const uint8_t *data;
  size_t size;
  std::promise<int> completion;
};
// The native worker and JS continuations both own the input control block.
// JS never retains a pointer to a native stack frame or stack std::promise.
using SharedInput=std::shared_ptr<Input>;
void CallJs(Napi::Env env,Napi::Function target,Context *ctx,SharedInput *arg){
  const auto input=*arg;
  if(!env){input->completion.set_value(libfuzzer::RETURN_EXIT);return;}
  try{
    const auto buffer=Napi::Buffer<uint8_t>::Copy(env,input->data,input->size);
    auto result=target.Call({buffer});
    if(result.IsPromise()){
      AsyncReturnsHandler();
      auto promise=result.As<Napi::Object>();
      promise.Get("then").As<Napi::Function>().Call(promise,{
        Napi::Function::New(env,[input](const Napi::CallbackInfo &){input->completion.set_value(libfuzzer::RETURN_CONTINUE);}),
        Napi::Function::New(env,[input,ctx](const Napi::CallbackInfo &info){
          const auto box=Napi::Object::New(info.Env());box.Set("reason",info[0]);
          ctx->error=Napi::Persistent(box);ctx->rejected=true;
          input->completion.set_value(libfuzzer::RETURN_EXIT);
        })});
    }else{SyncReturnsHandler();input->completion.set_value(libfuzzer::RETURN_CONTINUE);}
  }catch(const Napi::Error &error){
    const auto box=Napi::Object::New(env);box.Set("reason",error.Value());
    ctx->error=Napi::Persistent(box);ctx->rejected=true;
    input->completion.set_value(libfuzzer::RETURN_EXIT);
  }catch(const std::exception &error){
    const auto box=Napi::Object::New(env);box.Set("reason",Napi::Error::New(env,error.what()).Value());
    ctx->error=Napi::Persistent(box);ctx->rejected=true;
    input->completion.set_value(libfuzzer::RETURN_EXIT);
  }
}
using TSFN=Napi::TypedThreadSafeFunction<Context,SharedInput,CallJs>;
TSFN function;
int RunInput(const uint8_t *data,size_t size){
  auto input=std::make_shared<Input>();input->data=data;input->size=size;
  auto future=input->completion.get_future();
  if(function.BlockingCall(&input)!=napi_ok) return libfuzzer::RETURN_EXIT;
  return future.get();
}
}
Napi::Value StartFuzzingAsync(const Napi::CallbackInfo &info){
  if(info.Length()!=2||!info[0].IsFunction()||!info[1].IsArray())
    throw Napi::Error::New(info.Env(),"Expected target function and libFuzzer argument array");
  const auto target=info[0].As<Napi::Function>();
  if(target.Get("length").As<Napi::Number>().Int32Value()>1)
    throw Napi::Error::New(info.Env(),"Use tkur_jazzerjs JavaScript API for done-callback targets");
  auto args=LibFuzzerArgs(info.Env(),info[1].As<Napi::Array>());
  ClaimFuzzSession(info.Env());
  auto *ctx=new Context(info.Env());
  function=TSFN::New(info.Env(),target,"tkur_jazzerjs",0,1,ctx,
    [](Napi::Env env,void *,Context *ctx){
      ctx->thread.join();
      if(ctx->rejected){ctx->deferred.Reject(ctx->error.Value().Get("reason"));ctx->error.Reset();}
      else ctx->deferred.Resolve(env.Undefined());
      delete ctx;
    });
  ctx->thread=std::thread([args=std::move(args)]{
    StartLibFuzzer(args,RunInput);
    function.Release();
  });
  return ctx->deferred.Promise();
}
