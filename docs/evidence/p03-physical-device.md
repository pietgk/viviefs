# P03 physical-device path to motel

P03's pass condition is a known span in motel from a simulator, plus this
path. A physical-device run is not required to close P03.

motel listens on `127.0.0.1:27686` by default. An iOS Simulator and an
Android emulator (with `adb reverse tcp:27686 tcp:27686`, or
`http://10.0.2.2:27686`) can POST OTLP there. A physical phone cannot
reach the Mac's loopback.

## LAN binding

Start motel bound on all interfaces and point the dev client at the Mac's
LAN address:

```sh
MOTEL_OTEL_HOST=0.0.0.0 bun x motel daemon
```

On the device, `EXPO_PUBLIC_OTLP_URL=http://<mac-lan-ip>:27686`. The
phone and Mac must share a network. iOS App Transport Security needs a
cleartext exception for that HTTP origin in a development client. This
path is live `withSpan` export; a kill still loses the in-memory OTLP
buffer.

## Cursor catch-up

The durable path, which P10 qualifies, does not need the phone to reach
motel. Trace context is written in each changeset envelope (D32). A
projector reads the log from its cursor and POSTs OTLP when a host that
can reach a sink next runs. Re-enabling the cursor exports the backlog.
That is how a physical device contributes traces without LAN binding.
