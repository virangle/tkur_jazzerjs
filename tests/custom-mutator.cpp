// SPDX-License-Identifier: Apache-2.0
#include <cstddef>
#include <cstdint>
#include <cstdio>
extern "C" size_t LLVMFuzzerCustomMutator(uint8_t *data,size_t,size_t max,unsigned){
 static bool once=false;
 if(!once){std::fprintf(stderr,"TKUR_TEST_CUSTOM_MUTATOR_CALLED\n");once=true;}
 if(!max)return 0;data[0]='A';if(max>1){data[1]='B';return 2;}return 1;
}
