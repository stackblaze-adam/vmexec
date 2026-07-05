# ── Build nbdkit VDDK plugin (not in Debian slim repos) ─────────────────────
FROM debian:bookworm-slim AS nbdkit-vddk-build
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    ca-certificates git autoconf automake libtool pkg-config make gcc \
    nbdkit libnbd-dev \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /src
RUN git clone --depth 1 https://gitlab.com/nbdkit/nbdkit.git \
    && cd nbdkit \
    && autoreconf -i \
    && ./configure --disable-dependency-tracking \
    && make -j"$(nproc)"

# ── Vue SPA ──────────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ .
RUN npm run build

FROM python:3.11-slim

LABEL maintainer="THIS Cyber Security" \
      description="VMExec — VM Backup & Disaster Recovery"

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libffi-dev \
    libssl-dev \
    nbdkit \
    libnbd0 \
    libnbd-bin \
    && rm -rf /var/lib/apt/lists/*

COPY --from=nbdkit-vddk-build /src/nbdkit/plugins/vddk/.libs/nbdkit-vddk-plugin.so \
    /usr/lib/x86_64-linux-gnu/nbdkit/plugins/nbdkit-vddk-plugin.so

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
COPY --from=frontend-build /app/static/dist ./static/dist

RUN mkdir -p data bin/ovftool static vendor/vddk /tmp/vmware-root \
    && chmod 1777 /tmp/vmware-root

VOLUME ["/app/data"]

EXPOSE 8000

CMD ["python", "-u", "main.py"]
