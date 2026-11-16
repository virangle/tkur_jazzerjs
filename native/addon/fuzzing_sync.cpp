// Copyright 2022 Code Intelligence GmbH
// Copyright 2026 TKUR contributors
// SPDX-License-Identifier: Apache-2.0
// Derived from Jazzer.js4.0.0; native signals stay with libFuzzer, never longjmp through V8/C++.
#include "fuzzing_sync.h"
#include "shared/libfuzzer.h"
#include "utils.h"
namespace {
struct Target {
  Napi::Env env;Napi::Function function;Napi::Promise::Deferred deferred;bool rejected=false;
  Target(Napi::Env env,Napi::Function function):env(env),function(function),deferred(Napi::Promise::Deferred::New(env)){}
};
Target *target=nullptr;
int RunInput(const uint8_t *data,size_t size){
  Napi::HandleScope scope(target->env);
  try{
    auto result=target->function.Call({Napi::Buffer<uint8_t>::Copy(target->env,data,size)});
    if(result.IsPromise())throw Napi::Error::New(target->env,"Promise target requires asynchronous mode (remove --sync)");
    SyncReturnsHandler();return libfuzzer::RETURN_CONTINUE;
  }catch(const Napi::Error &error){
    target->rejected=true;target->deferred.Reject(error.Value());return libfuzzer::RETURN_EXIT;
  }
}
}
Napi::Value StartFuzzing(const Napi::CallbackInfo &info){
  if(info.Length()!=3||!info[0].IsFunction()||!info[1].IsArray()||!info[2].IsFunction())
    throw Napi::Error::New(info.Env(),"Expected synchronous target, libFuzzer args, signal callback");
  auto args=LibFuzzerArgs(info.Env(),info[1].As<Napi::Array>());
  ClaimFuzzSession(info.Env());
  target=new Target(info.Env(),info[0].As<Napi::Function>());
  StartLibFuzzer(args,RunInput);
  if(!target->rejected)target->deferred.Resolve(info.Env().Undefined());
  auto result=target->deferred.Promise();delete target;target=nullptr;return result;
}
