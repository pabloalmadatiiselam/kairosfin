#!/bin/bash
cd /opt/render/project/src
python -m uvicorn src.main:app --host 0.0.0.0 --port $PORT