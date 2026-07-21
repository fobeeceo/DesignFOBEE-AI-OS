# GBRICK AI ERP / Media OS 서비스 (Python). 상시 데몬이 아니라 온디맨드 CLI 실행용
# (docker compose run erp python src/erp_engine.py 형태). AI-HQ/docker-compose.yml 이 오케스트레이션.
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "src/erp_engine.py"]
