#!/usr/bin/env bash

npx protoc \
  --ts_out protos/ \
  --ts_opt generate_dependencies \
  --ts_opt ts_nocheck \
  --ts_opt eslint_disable \
  --proto_path protos \
  protos/service.proto
