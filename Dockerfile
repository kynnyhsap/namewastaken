FROM oven/bun:1.2.4

RUN bun --version

WORKDIR /app

COPY . .

RUN bun install

CMD ["bun", "start"]