#!/bin/bash
cd /opt/render/project/src/src
python -m uvicorn main:app --host 0.0.0.0 --port $PORT