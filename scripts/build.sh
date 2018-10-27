#!/bin/bash
npm run clean
npm run client:build
if [ "$?" -ne 0 ]; then
    echo -e "\033[31m[Error]\033[0m build client fail!"
    exit 1
fi
echo "====  build frontend success ===="

npm run server:build
if [ "$?" -ne 0 ]; then
    echo -e "\033[31m[Error]\033[0m build server fail!"
    exit 1
fi
echo "====  build nodejs success ===="
