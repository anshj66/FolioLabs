FROM debian:bookworm-slim
ENV DEBIAN_FRONTEND=noninteractive PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 texlive-latex-base texlive-latex-recommended texlive-fonts-recommended \
    latexmk texlive-bibtex-extra ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /srv/compiler
COPY app.py /srv/compiler/app.py
RUN useradd --system --uid 10002 --user-group --home-dir /nonexistent --shell /usr/sbin/nologin texrunner \
    && mkdir -p /tmp/texmf-cache
ENV HOME=/tmp/texmf-cache
EXPOSE 8080
CMD ["python3", "/srv/compiler/app.py"]
