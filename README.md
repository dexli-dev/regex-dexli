# regex.dexli.dev

Live regex tester with URL-shareable state. Type a pattern, see matches
highlight as you go, copy a link that restores the exact session. Part of
the [dexli.dev](https://dexli.dev) tiny-tools family alongside
[webhook.dexli.dev](https://webhook.dexli.dev) and
[cron.dexli.dev](https://cron.dexli.dev).

## Develop

```sh
npm install
npm run dev
```

## Build + run with Docker

```sh
docker build -t regex-dexli .
docker run --rm -p 3000:3000 regex-dexli
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the commit convention
(subject prefix + `Engineer:` body trailer). Bar item 12 requires
mechanically-verifiable worker attribution from `git log` alone.
