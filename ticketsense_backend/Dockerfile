FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    TOPIC_EMBEDDING_CACHE_DIR=/app/.model-cache/fastembed

WORKDIR /app

RUN apt-get update \
    && apt-get install --yes --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN python -m pip install --upgrade pip \
    && pip install -r requirements.txt

# Include the free local embedding model in the image. The backend and Celery
# worker share this image layer, so it is downloaded only once per build.
RUN mkdir -p "${TOPIC_EMBEDDING_CACHE_DIR}" \
    && python -c "from fastembed import TextEmbedding; TextEmbedding(model_name='BAAI/bge-small-en-v1.5', cache_dir='${TOPIC_EMBEDDING_CACHE_DIR}', threads=2)"

COPY . .

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

