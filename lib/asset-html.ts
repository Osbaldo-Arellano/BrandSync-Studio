import qrcode from "qrcode-generator";
import type { AssetTypeConfig } from "@/types/assets";

// Print-safe CMYK-friendly colors
const P = {
  light: {
    bg: "#ffffff",
    name: "#1a1a1a",
    secondary: "#4d4d4d",
    detail: "#595959",
    muted: "#808080",
    placeholder: "#cccccc",
    accent: "#1a56db",
    rule: "#cccccc",
  },
  dark: {
    bg: "#09090b",     // zinc-950
    name: "#fafafa",   // zinc-50
    secondary: "#a1a1aa", // zinc-400
    detail: "#71717a", // zinc-500
    muted: "#52525b",  // zinc-600
    placeholder: "#3f3f46", // zinc-700
    accent: "#2563eb", // blue-600
    rule: "#27272a",   // zinc-800
  },
} as const;

// Static logo/icon as inline data URIs (so they work in srcDoc iframes and Puppeteer)
const LOGOS = {
  light: {
    logo: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxOTIwIDQ2NC40NCI+CiAgPGRlZnM+CiAgICA8c3R5bGU+CiAgICAgIC5jbHMtMSB7CiAgICAgICAgc3Ryb2tlOiAjMDAwOwogICAgICAgIHN0cm9rZS1taXRlcmxpbWl0OiAxMDsKICAgICAgfQogICAgPC9zdHlsZT4KICA8L2RlZnM+CiAgPHBhdGggZD0iTTUwLjc3LDY5LjU3djMyMy42NWgzMjMuNjVWNjkuNTdINTAuNzdaTTIyNy4yOCwzNTEuODJ2LTIxLjIzaC0yOS4zOHYyMS4yM2gtMTA1Ljc0di0xMDUuNzRoMjAuMDV2LTI5LjM4aC0yMC4wNXYtMTA1Ljc0aDEwNS43NHYyMC4wNWgyOS4zOHYtMjAuMDVoMTA1Ljc0djEwNS43NGgtMjAuMDV2MjkuMzhoMjAuMDV2MTA1Ljc0aC0xMDUuNzRaIi8+CiAgPGc+CiAgICA8cGF0aCBkPSJNNDMxLjM2LDM5NC4wM3YtMTU0LjM5aDk1LjUxdjI4Ljc2aC02MS43djMyLjc4aDU4LjMydjI4Ljc2aC01OC4zMnYzNS4zMmg2My4xOHYyOC43NmgtOTYuOTlaIi8+CiAgICA8cGF0aCBkPSJNNTU2LjQ1LDM5NC4wM3YtMTI5LjQzaC0xMy43M3YtMjQuOTZoNDcuNzV2MTU0LjM5aC0zNC4wMloiLz4KICAgIDxwYXRoIGQ9Ik02MTQuMzQsMzM4LjJ2LTQuMjNjMC0zMC44OCwyMS4xMy01OS44NSw1OC45NS01OS44NXM1Ny42OSwyOC4xMyw1Ny42OSw1OS40M3YxMS40MmgtODQuNTJjMi4xMSwxNS42NSwxMC45OSwyNS41OSwyOC4xLDI1LjU5LDEyLjI2LDAsMjAuNS01LjA0LDIzLjI0LTEyLjQ4aDMxLjA2Yy01LjA3LDIzLjY5LTI1LjM2LDM5Ljk3LTU0LjMxLDM5Ljk3LTM5LjUxLDAtNjAuMjItMzAuMDMtNjAuMjItNTkuODVaTTY0Ni42NywzMjUuNzJoNTIuMTljLTIuMzItMTUuMjMtMTAuOTktMjQuMTEtMjUuNTctMjQuMTFzLTIzLjg4LDguNDYtMjYuNjIsMjQuMTFaIi8+CiAgICA8cGF0aCBkPSJNNzQ2LjE5LDMzOC40MXYtNC4wMmMwLTMxLjUxLDIwLjUtNjAuMjcsNTguOTUtNjAuMjcsMzEuMDYsMCw1My4yNSwxOS40Niw1NC45NCw0Ny41OGgtMzMuMTdjLTEuMDYtMTAuMzYtOC40NS0xOC42MS0yMS43Ni0xOC42MS0xNy4xMiwwLTI1LjE1LDEzLjU0LTI1LjE1LDMzLjQyczcuMTgsMzIuNTcsMjUuMzYsMzIuNTdjMTMuNTIsMCwyMS4xMy03LjYxLDIyLjYxLTE5LjI1aDMyLjk2Yy0xLjQ4LDI4Ljc2LTI0LjUxLDQ4LjIyLTU1LjU3LDQ4LjIyLTM5Ljk0LDAtNTkuMTctMjkuNC01OS4xNy01OS42NFoiLz4KICAgIDxwYXRoIGQ9Ik05MzUuMDksMzk1LjUxYy0zNC44NywwLTQ5LjAyLTExLjYzLTQ5LjAyLTQ2Ljc0di00NS44OWgtMTcuNTR2LTI0Ljc0aDE3LjU0di0zMS4zaDMxLjQ4djMxLjNoMzMuODF2MjQuNzRoLTMzLjgxdjQ3LjE2YzAsMTAuNzksNS45MiwxNi45MiwxNi42OSwxNi45MmgxNy4xMnYyOC41NWgtMTYuMjdaIi8+CiAgICA8cGF0aCBkPSJNOTc0LjE3LDM5NC4wM3YtMTE1LjloMjYuODR2MzguMjhjMi45Ni0yNS4zOCwxNi42OS0zOS43Niw0MC4xNS0zOS43Nmg0LjQ0djI5LjE5aC04LjQ1Yy0xOC44MSwwLTI5LjE2LDEwLjU3LTI5LjE2LDI5LjE5djU5aC0zMy44MVoiLz4KICAgIDxwYXRoIGQ9Ik0xMDY4LjYyLDM5NC4wM3YtOTAuOTRoLTE1LjQzdi0yNC45Nmg0OS4yM3YxMTUuOWgtMzMuODFaTTEwNjMuMTMsMjQ5LjE2YzAtMTAuMzYsNS45Mi0xNy43NiwxOC41OS0xNy43NnMxOC41OSw3LjQsMTguNTksMTcuNzYtNS45MiwxNy41NS0xOC41OSwxNy41NS0xOC41OS03LjQtMTguNTktMTcuNTVaIi8+CiAgICA8cGF0aCBkPSJNMTEyNi41MiwzMzguNDF2LTQuMDJjMC0zMS41MSwyMC41LTYwLjI3LDU4Ljk1LTYwLjI3LDMxLjA2LDAsNTMuMjUsMTkuNDYsNTQuOTQsNDcuNThoLTMzLjE3Yy0xLjA2LTEwLjM2LTguNDUtMTguNjEtMjEuNzYtMTguNjEtMTcuMTIsMC0yNS4xNSwxMy41NC0yNS4xNSwzMy40MnM3LjE4LDMyLjU3LDI1LjM2LDMyLjU3YzEzLjUyLDAsMjEuMTMtNy42MSwyMi42MS0xOS4yNWgzMi45NmMtMS40OCwyOC43Ni0yNC41MSw0OC4yMi01NS41Nyw0OC4yMi0zOS45NCwwLTU5LjE3LTI5LjQtNTkuMTctNTkuNjRaIi8+CiAgPC9nPgogIDxnPgogICAgPHBhdGggZD0iTTEyODAuNiwzOTUuMzN2LTU3Ljg0aDE0LjE0djU3Ljg0aC0xNC4xNFoiLz4KICAgIDxwYXRoIGQ9Ik0xMzA5LjA1LDM5NS4zM3YtNTcuODRoMjMuMTlsMjMuNzEsNDcuMzFoMS4yMXYtNDcuMzFoMTMuMjh2NTcuODRoLTIzLjM2bC0yMy43MS00Ny4zMWgtMS4yMXY0Ny4zMWgtMTMuMVoiLz4KICAgIDxwYXRoIGQ9Ik0xMzgxLjIxLDM2Ny4xMnYtMS43NGMwLTE0LjM0LDEwLTI5LjY0LDMxLjgxLTI5LjY0LDE3LjE2LDAsMjguNjIsOS4zNSwzMC4xNywyMy4yMmgtMTQuMjNjLTEuMjEtNi44OS03LjQxLTExLjA5LTE1Ljk1LTExLjA5LTExLjIxLDAtMTcuNSw3LjQ1LTE3LjUsMTguNDZzNi4zOCwxOC4zOCwxNy45MywxOC4zOGM4LjcxLDAsMTUuMjYtNC4xMiwxNi41NS0xMS4wMWgxNC4xNGMtMS41NSwxMi43Ni0xMi42NywyMy4xNC0zMC42OSwyMy4xNC0yMi43NiwwLTMyLjI0LTE2LjY0LTMyLjI0LTI5LjcxWiIvPgogICAgPHBhdGggZD0iTTE0NDkuOTIsMzk1LjMzdi0xNC4xOGgxNS4xN3YxNC4xOGgtMTUuMTdaIi8+CiAgPC9nPgogIDxnPgogICAgPHBhdGggZD0iTTUwMy44NCwxNzMuNzR2MzYuNTZoLTcyLjQ4VjY5LjM1aDE1OS4zMnY0Ny4zM2gtODYuODV2MTQuMTZoODYuODV2NDIuODloLTg2Ljg1WiIvPgogICAgPHBhdGggZD0iTTYwNS44OSwyMTAuMjlWNjkuMzVoNzIuNDh2OTEuMDdoNjEuN3Y0OS44N2gtMTM0LjE4WiIvPgogICAgPHBhdGggZD0iTTg3Ni45OSwyMTAuMjlsLTUuMDctMTguMTdoLTQ3LjEybC01LjA3LDE4LjE3aC03My45Nmw0NS4wMS0xNDAuOTRoMTE0Ljc0bDQ0LjM3LDE0MC45NGgtNzIuOVpNODQ4Ljg4LDEwOS4wOGwtMTUuMjEsNDQuNTloMjkuNzlsLTE0LjU4LTQ0LjU5WiIvPgogICAgPHBhdGggZD0iTTEwNzYuMjQsMjEwLjI5bC0xNy43NS02NC4yNC0xNy45Niw2NC4yNGgtNjkuMWwtMzkuNTEtMTQwLjk0aDcyLjlsMTQuNTgsNjkuNzMsMTYuOS02OS43M2g0Ny43NWwxNS42NCw2Ny40MSwxNS02Ny40MWg3MS40MmwtMzkuMDksMTQwLjk0aC03MC43OVoiLz4KICAgIDxwYXRoIGQ9Ik0xMTk5LjY0LDIxMC4yOVY2OS4zNWg3Mi40OHY5MS4wN2g2MS43djQ5Ljg3aC0xMzQuMThaIi8+CiAgICA8cGF0aCBkPSJNMTM0Ny45NiwyMTAuMjlWNjkuMzVoMTYxLjY1djQ1LjIyaC04OS4xN3YxMy4xaDg5LjE3djMzLjgxaC04OS4xN3YxMS44M2g4OS4xN3YzNi45OGgtMTYxLjY1WiIvPgogICAgPHBhdGggZD0iTTE1MjcuMzUsMTY3LjRjMzEuNyw0Ljg2LDUzLjY3LDYuNzYsNzguODIsNi43Niw2LjM0LDAsOS43Mi0yLjExLDkuNzItNi4zNCwwLTMuNTktMi4zMi00Ljg2LTkuOTMtNC44NmgtMTEuODNjLTUuNzEsMC0xOC4zOC0uODUtMjYuNjItMS42OS0xNy43NS0xLjktMjguNTMtNi43Ni0zNS43MS0xNi4wNi01LjQ5LTYuOTctOC4yNC0xNi4yNy04LjI0LTI3LjA1LDAtMTYuMDYsNS43MS0yOC45NSwxNi42OS0zNy4xOSwxMi40Ny05LjMsMzcuNC0xNC41OCw3MC4xNS0xNC41OCwyNC45MywwLDUwLjUsMi4zMiw3NC4zOCw2Ljk3djQxLjQyYy0xMC43OC0xLjktMzkuNzMtNC40NC01Ni44NC00Ljg2aC0xNS44NWMtOS43MiwwLTEzLjUyLDEuOS0xMy41Miw2LjM0LDAsMy41OSwyLjk2LDUuNzEsNy44Miw1LjcxbDI1LjM2LjIxYzE0LjU4LjIxLDI4LjEsMi4xMSwzNi4zNCw1LjI4LDEzLjMxLDUuMDcsMjIuMTksMTkuMDIsMjIuMTksMzUuMDhzLTguMjQsMjkuNzktMjEuOTgsMzguNDZjLTE0Ljc5LDkuMy0zMC40MywxMi4yNi02Mi43NiwxMi4yNi0yOC41MywwLTQ3Ljk3LTEuNjktNzguMTgtNy4xOHYtMzguNjdaIi8+CiAgICA8cGF0aCBkPSJNMTcwNi4zMiwxNjcuNGMzMS43LDQuODYsNTMuNjcsNi43Niw3OC44Miw2Ljc2LDYuMzQsMCw5LjcyLTIuMTEsOS43Mi02LjM0LDAtMy41OS0yLjMyLTQuODYtOS45My00Ljg2aC0xMS44M2MtNS43MSwwLTE4LjM4LS44NS0yNi42Mi0xLjY5LTE3Ljc1LTEuOS0yOC41My02Ljc2LTM1LjcxLTE2LjA2LTUuNDktNi45Ny04LjI0LTE2LjI3LTguMjQtMjcuMDUsMC0xNi4wNiw1LjcxLTI4Ljk1LDE2LjY5LTM3LjE5LDEyLjQ3LTkuMywzNy40LTE0LjU4LDcwLjE1LTE0LjU4LDI0LjkzLDAsNTAuNSwyLjMyLDc0LjM4LDYuOTd2NDEuNDJjLTEwLjc4LTEuOS0zOS43My00LjQ0LTU2Ljg0LTQuODZoLTE1Ljg1Yy05LjcyLDAtMTMuNTIsMS45LTEzLjUyLDYuMzQsMCwzLjU5LDIuOTYsNS43MSw3LjgyLDUuNzFsMjUuMzYuMjFjMTQuNTguMjEsMjguMSwyLjExLDM2LjM0LDUuMjgsMTMuMzEsNS4wNywyMi4xOSwxOS4wMiwyMi4xOSwzNS4wOHMtOC4yNCwyOS43OS0yMS45OCwzOC40NmMtMTQuNzksOS4zLTMwLjQzLDEyLjI2LTYyLjc2LDEyLjI2LTI4LjUzLDAtNDcuOTctMS42OS03OC4xOC03LjE0di0zOC42N1oiLz4KICA8L2c+CiAgPHBvbHlnb24gY2xhc3M9ImNscy0xIiBwb2ludHM9IjI5Ny4xOCAxMzQuMjMgMTY4LjgxIDIxMy41NCAyMDMuMjMgMjMzLjY2IDEyNS4yMSAzMjguNyAyNzQuMiAyMjAuMzMgMjM2LjE2IDE5OC4xIDI5Ny4xOCAxMzQuMjMiLz4KPC9zdmc+",
    icon: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzNjQuNTkgMzYwLjgyIj4KICA8ZGVmcz4KICAgIDxzdHlsZT4KICAgICAgLmNscy0xIHsKICAgICAgICBzdHJva2U6ICMwMDA7CiAgICAgICAgc3Ryb2tlLW1pdGVybGltaXQ6IDEwOwogICAgICB9CiAgICA8L3N0eWxlPgogIDwvZGVmcz4KICA8cGF0aCBkPSJNMjEuMDQsMTkuMDR2MzIzLjY1aDMyMy42NVYxOS4wNEgyMS4wNFpNMTk3LjU1LDMwMS4zdi0yMS4yM2gtMjkuMzh2MjEuMjNINjIuNDR2LTEwNS43NGgyMC4wNXYtMjkuMzhoLTIwLjA1VjYwLjQ1aDEwNS43NHYyMC4wNWgyOS4zOHYtMjAuMDVoMTA1Ljc0djEwNS43NGgtMjAuMDV2MjkuMzhoMjAuMDV2MTA1Ljc0aC0xMDUuNzRaIi8+CiAgPHBvbHlnb24gY2xhc3M9ImNscy0xIiBwb2ludHM9IjI2Ny40NSA4My43MSAxMzkuMDggMTYzLjAyIDE3My41IDE4My4xMyA5NS40OCAyNzguMTcgMjQ0LjQ4IDE2OS44IDIwNi40MyAxNDcuNTcgMjY3LjQ1IDgzLjcxIi8+Cjwvc3ZnPg==",
  },
  dark: {
    logo: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxOTIwIDQ2NC40NCI+CiAgPGRlZnM+CiAgICA8c3R5bGU+CiAgICAgIC5jbHMtMSwgLmNscy0yIHsKICAgICAgICBmaWxsOiAjZmZmOwogICAgICB9CgogICAgICAuY2xzLTIgewogICAgICAgIHN0cm9rZTogIzAwMDsKICAgICAgICBzdHJva2UtbWl0ZXJsaW1pdDogMTA7CiAgICAgIH0KICAgIDwvc3R5bGU+CiAgPC9kZWZzPgogIDxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTUwLjc3LDY5LjU3djMyMy42NWgzMjMuNjVWNjkuNTdINTAuNzdaTTIyNy4yOCwzNTEuODJ2LTIxLjIzaC0yOS4zOHYyMS4yM2gtMTA1Ljc0di0xMDUuNzRoMjAuMDV2LTI5LjM4aC0yMC4wNXYtMTA1Ljc0aDEwNS43NHYyMC4wNWgyOS4zOHYtMjAuMDVoMTA1Ljc0djEwNS43NGgtMjAuMDV2MjkuMzhoMjAuMDV2MTA1Ljc0aC0xMDUuNzRaIi8+CiAgPGc+CiAgICA8cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik00MzEuMzYsMzk0LjAzdi0xNTQuMzloOTUuNTF2MjguNzZoLTYxLjd2MzIuNzhoNTguMzJ2MjguNzZoLTU4LjMydjM1LjMyaDYzLjE4djI4Ljc2aC05Ni45OVoiLz4KICAgIDxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTU1Ni40NSwzOTQuMDN2LTEyOS40M2gtMTMuNzN2LTI0Ljk2aDQ3Ljc1djE1NC4zOWgtMzQuMDJaIi8+CiAgICA8cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik02MTQuMzQsMzM4LjJ2LTQuMjNjMC0zMC44OCwyMS4xMy01OS44NSw1OC45NS01OS44NXM1Ny42OSwyOC4xMyw1Ny42OSw1OS40M3YxMS40MmgtODQuNTJjMi4xMSwxNS42NSwxMC45OSwyNS41OSwyOC4xLDI1LjU5LDEyLjI2LDAsMjAuNS01LjA0LDIzLjI0LTEyLjQ4aDMxLjA2Yy01LjA3LDIzLjY5LTI1LjM2LDM5Ljk3LTU0LjMxLDM5Ljk3LTM5LjUxLDAtNjAuMjItMzAuMDMtNjAuMjItNTkuODVaTTY0Ni42NywzMjUuNzJoNTIuMTljLTIuMzItMTUuMjMtMTAuOTktMjQuMTEtMjUuNTctMjQuMTFzLTIzLjg4LDguNDYtMjYuNjIsMjQuMTFaIi8+CiAgICA8cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik03NDYuMTksMzM4LjQxdi00LjAyYzAtMzEuNTEsMjAuNS02MC4yNyw1OC45NS02MC4yNywzMS4wNiwwLDUzLjI1LDE5LjQ2LDU0Ljk0LDQ3LjU4aC0zMy4xN2MtMS4wNi0xMC4zNi04LjQ1LTE4LjYxLTIxLjc2LTE4LjYxLTE3LjEyLDAtMjUuMTUsMTMuNTQtMjUuMTUsMzMuNDJzNy4xOCwzMi41NywyNS4zNiwzMi41N2MxMy41MiwwLDIxLjEzLTcuNjEsMjIuNjEtMTkuMjVoMzIuOTZjLTEuNDgsMjguNzYtMjQuNTEsNDguMjItNTUuNTcsNDguMjItMzkuOTQsMC01OS4xNy0yOS40LTU5LjE3LTU5LjY0WiIvPgogICAgPHBhdGggY2xhc3M9ImNscy0xIiBkPSJNOTM1LjA5LDM5NS41MWMtMzQuODcsMC00OS4wMi0xMS42My00OS4wMi00Ni43NHYtNDUuODloLTE3LjU0di0yNC43NGgxNy41NHYtMzEuM2gzMS40OHYzMS4zaDMzLjgxdjI0Ljc0aC0zMy44MXY0Ny4xNmMwLDEwLjc5LDUuOTIsMTYuOTIsMTYuNjksMTYuOTJoMTcuMTJ2MjguNTVoLTE2LjI3WiIvPgogICAgPHBhdGggY2xhc3M9ImNscy0xIiBkPSJNOTc0LjE3LDM5NC4wM3YtMTE1LjloMjYuODR2MzguMjhjMi45Ni0yNS4zOCwxNi42OS0zOS43Niw0MC4xNS0zOS43Nmg0LjQ0djI5LjE5aC04LjQ1Yy0xOC44MSwwLTI5LjE2LDEwLjU3LTI5LjE2LDI5LjE5djU5aC0zMy44MVoiLz4KICAgIDxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTEwNjguNjIsMzk0LjAzdi05MC45NGgtMTUuNDN2LTI0Ljk2aDQ5LjIzdjExNS45aC0zMy44MVpNMTA2My4xMywyNDkuMTZjMC0xMC4zNiw1LjkyLTE3Ljc2LDE4LjU5LTE3Ljc2czE4LjU5LDcuNCwxOC41OSwxNy43Ni01LjkyLDE3LjU1LTE4LjU5LDE3LjU1LTE4LjU5LTcuNC0xOC41OS0xNy41NVoiLz4KICAgIDxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTExMjYuNTIsMzM4LjQxdi00LjAyYzAtMzEuNTEsMjAuNS02MC4yNyw1OC45NS02MC4yNywzMS4wNiwwLDUzLjI1LDE5LjQ2LDU0Ljk0LDQ3LjU4aC0zMy4xN2MtMS4wNi0xMC4zNi04LjQ1LTE4LjYxLTIxLjc2LTE4LjYxLTE3LjEyLDAtMjUuMTUsMTMuNTQtMjUuMTUsMzMuNDJzNy4xOCwzMi41NywyNS4zNiwzMi41N2MxMy41MiwwLDIxLjEzLTcuNjEsMjIuNjEtMTkuMjVoMzIuOTZjLTEuNDgsMjguNzYtMjQuNTEsNDguMjItNTUuNTcsNDguMjItMzkuOTQsMC01OS4xNy0yOS40LTU5LjE3LTU5LjY0WiIvPgogIDwvZz4KICA8Zz4KICAgIDxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTEyODAuNiwzOTUuMzN2LTU3Ljg0aDE0LjE0djU3Ljg0aC0xNC4xNFoiLz4KICAgIDxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTEzMDkuMDUsMzk1LjMzdi01Ny44NGgyMy4xOWwyMy43MSw0Ny4zMWgxLjIxdi00Ny4zMWgxMy4yOHY1Ny44NGgtMjMuMzZsLTIzLjcxLTQ3LjMxaC0xLjIxdjQ3LjMxaC0xMy4xWiIvPgogICAgPHBhdGggY2xhc3M9ImNscy0xIiBkPSJNMTM4MS4yMSwzNjcuMTJ2LTEuNzRjMC0xNC4zNCwxMC0yOS42NCwzMS44MS0yOS42NCwxNy4xNiwwLDI4LjYyLDkuMzUsMzAuMTcsMjMuMjJoLTE0LjIzYy0xLjIxLTYuODktNy40MS0xMS4wOS0xNS45NS0xMS4wOS0xMS4yMSwwLTE3LjUsNy40NS0xNy41LDE4LjQ2czYuMzgsMTguMzgsMTcuOTMsMTguMzhjOC43MSwwLDE1LjI2LTQuMTIsMTYuNTUtMTEuMDFoMTQuMTRjLTEuNTUsMTIuNzYtMTIuNjcsMjMuMTQtMzAuNjksMjMuMTQtMjIuNzYsMC0zMi4yNC0xNi42NC0zMi4yNC0yOS43MVoiLz4KICAgIDxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTE0NDkuOTIsMzk1LjMzdi0xNC4xOGgxNS4xN3YxNC4xOGgtMTUuMTdaIi8+CiAgPC9nPgogIDxnPgogICAgPHBhdGggY2xhc3M9ImNscy0xIiBkPSJNNTAzLjg0LDE3My43NHYzNi41NmgtNzIuNDhWNjkuMzVoMTU5LjMydjQ3LjMzaC04Ni44NXYxNC4xNmg4Ni44NXY0Mi44OWgtODYuODVaIi8+CiAgICA8cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik02MDUuODksMjEwLjI5VjY5LjM1aDcyLjQ4djkxLjA3aDYxLjd2NDkuODdoLTEzNC4xOFoiLz4KICAgIDxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTg3Ni45OSwyMTAuMjlsLTUuMDctMTguMTdoLTQ3LjEybC01LjA3LDE4LjE3aC03My45Nmw0NS4wMS0xNDAuOTRoMTE0Ljc0bDQ0LjM3LDE0MC45NGgtNzIuOVpNODQ4Ljg4LDEwOS4wOGwtMTUuMjEsNDQuNTloMjkuNzlsLTE0LjU4LTQ0LjU5WiIvPgogICAgPHBhdGggY2xhc3M9ImNscy0xIiBkPSJNMTA3Ni4yNCwyMTAuMjlsLTE3Ljc1LTY0LjI0LTE3Ljk2LDY0LjI0aC02OS4xbC0zOS41MS0xNDAuOTRoNzIuOWwxNC41OCw2OS43MywxNi45LTY5LjczaDQ3Ljc1bDE1LjY0LDY3LjQxLDE1LTY3LjQxaDcxLjQybC0zOS4wOSwxNDAuOTRoLTcwLjc5WiIvPgogICAgPHBhdGggY2xhc3M9ImNscy0xIiBkPSJNMTE5OS42NCwyMTAuMjlWNjkuMzVoNzIuNDh2OTEuMDdoNjEuN3Y0OS44N2gtMTM0LjE4WiIvPgogICAgPHBhdGggY2xhc3M9ImNscy0xIiBkPSJNMTM0Ny45NiwyMTAuMjlWNjkuMzVoMTYxLjY1djQ1LjIyaC04OS4xN3YxMy4xaDg5LjE3djMzLjgxaC04OS4xN3YxMS44M2g4OS4xN3YzNi45OGgtMTYxLjY1WiIvPgogICAgPHBhdGggY2xhc3M9ImNscy0xIiBkPSJNMTUyNy4zNSwxNjcuNGMzMS43LDQuODYsNTMuNjcsNi43Niw3OC44Miw2Ljc2LDYuMzQsMCw5LjcyLTIuMTEsOS43Mi02LjM0LDAtMy41OS0yLjMyLTQuODYtOS45My00Ljg2aC0xMS44M2MtNS43MSwwLTE4LjM4LS44NS0yNi42Mi0xLjY5LTE3Ljc1LTEuOS0yOC41My02Ljc2LTM1LjcxLTE2LjA2LTUuNDktNi45Ny04LjI0LTE2LjI3LTguMjQtMjcuMDUsMC0xNi4wNiw1LjcxLTI4Ljk1LDE2LjY5LTM3LjE5LDEyLjQ3LTkuMywzNy40LTE0LjU4LDcwLjE1LTE0LjU4LDI0LjkzLDAsNTAuNSwyLjMyLDc0LjM4LDYuOTd2NDEuNDJjLTEwLjc4LTEuOS0zOS43My00LjQ0LTU2Ljg0LTQuODZoLTE1Ljg1Yy05LjcyLDAtMTMuNTIsMS45LTEzLjUyLDYuMzQsMCwzLjU5LDIuOTYsNS43MSw3LjgyLDUuNzFsMjUuMzYuMjFjMTQuNTguMjEsMjguMSwyLjExLDM2LjM0LDUuMjgsMTMuMzEsNS4wNywyMi4xOSwxOS4wMiwyMi4xOSwzNS4wOHMtOC4yNCwyOS43OS0yMS45OCwzOC40NmMtMTQuNzksOS4zLTMwLjQzLDEyLjI2LTYyLjc2LDEyLjI2LTI4LjUzLDAtNDcuOTctMS42OS03OC4xOC03LjE4di0zOC42N1oiLz4KICAgIDxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTE3MDYuMzIsMTY3LjRjMzEuNyw0Ljg2LDUzLjY3LDYuNzYsNzguODIsNi43Niw2LjM0LDAsOS43Mi0yLjExLDkuNzItNi4zNCwwLTMuNTktMi4zMi00Ljg2LTkuOTMtNC44NmgtMTEuODNjLTUuNzEsMC0xOC4zOC0uODUtMjYuNjItMS42OS0xNy43NS0xLjktMjguNTMtNi43Ni0zNS43MS0xNi4wNi01LjQ5LTYuOTctOC4yNC0xNi4yNy04LjI0LTI3LjA1LDAtMTYuMDYsNS43MS0yOC45NSwxNi42OS0zNy4xOSwxMi40Ny05LjMsMzcuNC0xNC41OCw3MC4xNS0xNC41OCwyNC45MywwLDUwLjUsMi4zMiw3NC4zOCw2Ljk3djQxLjQyYy0xMC43OC0xLjktMzkuNzMtNC40NC01Ni44NC00Ljg2aC0xNS44NWMtOS43MiwwLTEzLjUyLDEuOS0xMy41Miw2LjM0LDAsMy41OSwyLjk2LDUuNzEsNy44Miw1LjcxbDI1LjM2LjIxYzE0LjU4LjIxLDI4LjEsMi4xMSwzNi4zNCw1LjI4LDEzLjMxLDUuMDcsMjIuMTksMTkuMDIsMjIuMTksMzUuMDhzLTguMjQsMjkuNzktMjEuOTgsMzguNDZjLTE0Ljc5LDkuMy0zMC40MywxMi4yNi02Mi43NiwxMi4yNi0yOC41MywwLTQ3Ljk3LTEuNjktNzguMTgtNy4xOHYtMzguNjdaIi8+CiAgPC9nPgogIDxwb2x5Z29uIGNsYXNzPSJjbHMtMiIgcG9pbnRzPSIyOTcuMTggMTM0LjIzIDE2OC44MSAyMTMuNTQgMjAzLjIzIDIzMy42NiAxMjUuMjEgMzI4LjcgMjc0LjIgMjIwLjMzIDIzNi4xNiAxOTguMSAyOTcuMTggMTM0LjIzIi8+Cjwvc3ZnPg==",
    icon: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzNjQuNTkgMzYwLjgyIj4KICA8ZGVmcz4KICAgIDxzdHlsZT4KICAgICAgLmNscy0xLCAuY2xzLTIgewogICAgICAgIGZpbGw6ICNmZmY7CiAgICAgIH0KCiAgICAgIC5jbHMtMiB7CiAgICAgICAgc3Ryb2tlOiAjMDAwOwogICAgICAgIHN0cm9rZS1taXRlcmxpbWl0OiAxMDsKICAgICAgfQogICAgPC9zdHlsZT4KICA8L2RlZnM+CiAgPHBhdGggY2xhc3M9ImNscy0xIiBkPSJNMjEuMDQsMTkuMDR2MzIzLjY1aDMyMy42NVYxOS4wNEgyMS4wNFpNMTk3LjU1LDMwMS4zdi0yMS4yM2gtMjkuMzh2MjEuMjNINjIuNDR2LTEwNS43NGgyMC4wNXYtMjkuMzhoLTIwLjA1VjYwLjQ1aDEwNS43NHYyMC4wNWgyOS4zOHYtMjAuMDVoMTA1Ljc0djEwNS43NGgtMjAuMDV2MjkuMzhoMjAuMDV2MTA1Ljc0aC0xMDUuNzRaIi8+CiAgPHBvbHlnb24gY2xhc3M9ImNscy0yIiBwb2ludHM9IjI2Ny40NSA4My43MSAxMzkuMDggMTYzLjAyIDE3My41IDE4My4xMyA5NS40OCAyNzguMTcgMjQ0LjQ4IDE2OS44IDIwNi40MyAxNDcuNTcgMjY3LjQ1IDgzLjcxIi8+Cjwvc3ZnPg==",
  },
} as const;

interface GenerateOptions {
  asset: AssetTypeConfig;
  templateId: string;
  fields: Record<string, string>;
  logo: string | null;   // wide/horizontal logo — falls back to static if null
  icon: string | null;   // square brand mark — falls back to static if null
  tagline: string;       // from brand.tagline; used by all templates
  website?: string;      // from brand.website; encoded into QR code on business cards
  dark?: boolean;
  /** For multi-page assets (business cards): render only "front" or "back". Omit for full document. */
  page?: "front" | "back";
}

export function generateAssetHTML(opts: GenerateOptions): string {
  const key = `${opts.asset.id}::${opts.templateId}`;
  const gen = GENERATORS[key];
  if (!gen) return fallbackHTML(opts);
  return gen(opts);
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

export function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function printReset(w: string, h: string, bg: string): string {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    @page { size: ${w} ${h}; margin: 0; }
    html, body {
      width: ${w}; height: ${h};
      margin: 0; padding: 0; background: ${bg};
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      color-adjust: exact;
    }
    body { font-family: system-ui, -apple-system, sans-serif; }
  `;
}

export function logoImg(src: string | null, maxH: string, maxW: string): string {
  if (!src) return "";
  return `<img src="${src}" alt="Logo" style="max-height:${maxH};max-width:${maxW};object-fit:contain;">`;
}

export function wrap(w: string, h: string, bg: string, css: string, body: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
${printReset(w, h, bg)}
${css}
</style></head><body>${body}</body></html>`;
}

/** Like wrap(), but also loads Montserrat (Nexa Black lookalike) from Google Fonts. */
export function wrapWithFont(w: string, h: string, bg: string, css: string, body: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700;800;900&display=swap">
<style>
${printReset(w, h, bg)}
body { font-family: 'Montserrat', system-ui, sans-serif; }
${css}
</style></head><body>${body}</body></html>`;
}

// ---------------------------------------------------------------------------
// Generator registry
// ---------------------------------------------------------------------------

type GenFn = (opts: GenerateOptions) => string;
const GENERATORS: Record<string, GenFn> = {};

function reg(assetId: string, templateId: string, fn: GenFn) {
  GENERATORS[`${assetId}::${templateId}`] = fn;
}

// ---------------------------------------------------------------------------
// Spanish tagline lookup — template ids ending in "-es" get Spanish text
// ---------------------------------------------------------------------------

const TAGLINE_ES = "Disciplina militar. Precisión de oficio.";

/**
 * Resolve the tagline for a template.
 * Priority: Spanish override (for -es templates) > brand tagline > field tagline > ""
 */
function resolveTagline(templateId: string, brandTagline: string, fieldTagline?: string): string {
  if (templateId.endsWith("-es")) return TAGLINE_ES;
  return brandTagline || fieldTagline || "";
}

/** Return palette and static logo fallbacks for a template id. */
function themeFor(templateId: string) {
  const isDark = templateId.startsWith("dark");
  return { c: isDark ? P.dark : P.light, l: isDark ? LOGOS.dark : LOGOS.light };
}

/** Generate an inline scalable SVG QR code for the given URL. */
function qrSvg(url: string): string {
  const qr = qrcode(0, "M");
  qr.addData(url);
  qr.make();
  return qr.createSvgTag({ scalable: true, margin: 1 });
}

/**
 * Five filled 5-pointed stars as a self-contained inline SVG.
 * Uses pure geometry — no font or glyph dependency — so it renders correctly
 * in every context: email clients, Puppeteer PDF, srcDoc iframes, browsers.
 *
 * Math: outer radius R = size/2, inner radius r = R*0.38 (classic star proportion).
 * 10 path points per star alternating outer/inner at 36° increments, starting at -90°.
 */
function fiveStarsSvg(size: number, color: string): string {
  const R  = size / 2;
  const r  = R * 0.38;
  const cx = R;
  const cy = R;
  const gap   = Math.ceil(size * 0.14);
  const step  = size + gap;
  const totalW = 5 * size + 4 * gap;

  function starPath(offsetX: number): string {
    const pts: string[] = [];
    for (let k = 0; k < 5; k++) {
      const outerA = Math.PI * (-0.5 + (2 * k) / 5);
      const innerA = Math.PI * (-0.5 + (2 * k + 1) / 5);
      pts.push(
        `${(offsetX + cx + R * Math.cos(outerA)).toFixed(2)},${(cy + R * Math.sin(outerA)).toFixed(2)}`,
        `${(offsetX + cx + r * Math.cos(innerA)).toFixed(2)},${(cy + r * Math.sin(innerA)).toFixed(2)}`,
      );
    }
    return `M${pts.join("L")}Z`;
  }

  const paths = [0, 1, 2, 3, 4]
    .map((i) => `<path fill="${color}" d="${starPath(i * step)}"/>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${size}" viewBox="0 0 ${totalW} ${size}" aria-label="5 stars">${paths}</svg>`;
}

/** Resolve logo/icon src — returns null if none uploaded (no hardcoded fallback). */
function assets(opts: GenerateOptions) {
  return {
    logoSrc: opts.logo ?? null,
    iconSrc: opts.icon ?? null,
  };
}

// Social icons (colored, print-safe inline SVG)
const FB_ICON  = `<svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="5" fill="#1877F2"/><path d="M13.5 8H12a.5.5 0 0 0-.5.5V10h2l-.3 2H11.5v6h-2v-6H8V10h1.5V8.5A2.5 2.5 0 0 1 12 6h1.5v2z" fill="#fff"/></svg>`;
const IG_ICON  = `<svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="5" fill="#E4405F"/><rect x="6" y="6" width="12" height="12" rx="3" fill="none" stroke="#fff" stroke-width="1.5"/><circle cx="12" cy="12" r="3" fill="none" stroke="#fff" stroke-width="1.5"/><circle cx="16.5" cy="7.5" r="1" fill="#fff"/></svg>`;

// ---------------------------------------------------------------------------
// BUSINESS CARDS
// ---------------------------------------------------------------------------

function businessCard(templateId: string): GenFn {
  return (opts) => {
    const { asset, fields, page } = opts;
    const { c } = themeFor(templateId);
    const { logoSrc, iconSrc } = assets(opts);
    const tagline = resolveTagline(templateId, opts.tagline, fields.tagline);
    const websiteUrl = opts.website || fields.website || "";
    const qr = websiteUrl ? qrSvg(websiteUrl) : "";

    const css = `
      /* ── Front ── */
      /* Card is a column: brand zone top, contact zone bottom, space between */
      .card { width:${asset.width}; height:${asset.height}; background:${c.bg}; display:flex; flex-direction:column; justify-content:space-between; padding:20px; page-break-after:always; }
      /* Brand zone: logo stacked above the accent bar, both left-anchored */
      .brand-top { display:flex; flex-direction:column; align-items:flex-start; }
      .accent { width:28px; height:3px; background:#000000; margin-top:5px; }
      /* Contact zone: info block left, icon right, both pinned to the bottom edge */
      .bottom { display:flex; align-items:flex-end; justify-content:space-between; gap:12px; }
      .info { flex:1; min-width:0; }
      /* Name is the visual anchor — heavier and larger than everything else */
      .name { font-size:14px; font-weight:800; letter-spacing:0.05em; color:${c.name}; margin-bottom:3px; }
      /* Title sits close to name (same identity cluster) */
      .sub { font-size:9px; font-weight:500; color:${c.secondary}; margin-bottom:8px; }
      /* 8 px gap creates a clear break between "who you are" and "how to reach you" */
      .contact { font-size:9px; font-weight:400; color:${c.detail}; line-height:1.7; }
      .front-icon { width:48px; height:48px; flex-shrink:0; object-fit:contain; }

      /* ── Back ── */
      /* QR centered vertically; brand-col stretches full height for space-between distribution */
      .back { width:${asset.width}; height:${asset.height}; background:${c.bg}; display:flex; align-items:center; padding:20px; gap:16px; }
      .back .qr-col { width:100px; height:100px; flex-shrink:0; }
      .back .qr-col svg { width:100%; height:100%; display:block; }
      /* align-self:stretch fills the content height regardless of parent align-items */
      .back .brand-col { flex:1; display:flex; flex-direction:column; justify-content:space-between; align-self:stretch; }
      .back .b-logo { max-height:36px; max-width:170px; object-fit:contain; }
      .back .b-tag { font-size:9px; font-weight:500; color:${c.secondary}; margin-top:3px; }
      .back .divider { height:1px; background:${c.rule}; margin:6px 0; }
      .back .find-us { font-size:7px; font-weight:800; color:${c.muted}; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:5px; }
      .back .social-row { display:flex; gap:6px; align-items:center; }

      /* ── Back (no QR — centered fallback) ── */
      .back-center { width:${asset.width}; height:${asset.height}; background:${c.bg}; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; padding:20px; }
      .back-center .b-logo { max-height:44px; max-width:240px; object-fit:contain; }
      .back-center .b-tag { font-size:9px; font-weight:500; color:${c.secondary}; }
      .back-center .divider { width:56%; height:1px; background:${c.rule}; margin:3px 0; }
      .back-center .find-us { font-size:7px; font-weight:800; color:${c.muted}; letter-spacing:0.12em; text-transform:uppercase; margin-bottom:3px; }
      .back-center .social-row { display:flex; gap:6px; align-items:center; }
    `;

    // Front — brand zone (logo + accent) top, contact zone bottom-right with icon
    const frontHTML = `<div class="card">
      <div class="brand-top">
        ${logoImg(logoSrc, "44px", "130px")}
        <div class="accent"></div>
      </div>
      <div class="bottom">
        <div class="info">
          <div class="name">${esc(fields.name || "")}</div>
          <div class="sub">${esc(fields.title || "")}</div>
          <div class="contact"><p style="font-style:italic">${esc(fields.email || "")}</p><p style="font-weight:500">${esc(fields.phone || "")}</p></div>
        </div>
        ${iconSrc ? `<img src="${iconSrc}" alt="Icon" class="front-icon">` : ""}
      </div>
    </div>`;

    // Back — QR left + logo/social right (no icon); or centered if no website
    const backHTML = qr
      ? `<div class="back">
          <div class="qr-col">${qr}</div>
          <div class="brand-col">
            <div>
              ${logoSrc ? `<img src="${logoSrc}" alt="Logo" class="b-logo">` : ""}
              <div class="b-tag">${esc(tagline)}</div>
            </div>
            <div>
              <div class="divider"></div>
              <div class="find-us">FIND US ON</div>
              <div class="social-row">${FB_ICON}${IG_ICON}</div>
            </div>
          </div>
        </div>`
      : `<div class="back-center">
          ${logoSrc ? `<img src="${logoSrc}" alt="Logo" class="b-logo">` : ""}
          <div class="b-tag">${esc(tagline)}</div>
          <div class="divider"></div>
          <div class="find-us">FIND US ON</div>
          <div class="social-row">${FB_ICON}${IG_ICON}</div>
        </div>`;

    if (page === "front") return wrapWithFont(asset.width, asset.height, c.bg, css, frontHTML);
    if (page === "back") return wrapWithFont(asset.width, asset.height, c.bg, css, backHTML);
    return wrapWithFont(asset.width, asset.height, c.bg, css, frontHTML + backHTML);
  };
}

reg("business-card", "light", businessCard("light"));
reg("business-card", "light-es", businessCard("light-es"));

// ---------------------------------------------------------------------------
// GOOGLE REVIEW CARDS
// Double-sided: front = brand zone + star CTA, back = hero QR + stars + logo
// ---------------------------------------------------------------------------

// Google-brand star color
const STAR_COLOR = "#FBBC05";

function googleReviewCard(templateId: string): GenFn {
  return (opts) => {
    const { asset, fields, page } = opts;
    const { c } = themeFor(templateId);
    const { logoSrc } = assets(opts);
    const isEs = templateId.endsWith("-es");

    // Copy strings
    const headline  = isEs ? "¿Cómo fue su experiencia?"              : "How Did We Do?";
    const subhead   = isEs ? "Nos encantaría tu opinión en Google"     : "We'd love your feedback on Google";
    const flipHint  = isEs ? "Dale la vuelta y escanea para dejar una reseña" : "Flip over & scan to leave a review";
    const backLabel = isEs ? "CALIFÍCANOS EN GOOGLE"                   : "RATE US ON GOOGLE";

    const googleUrl = fields.googleUrl || "";
    const qr = googleUrl ? qrSvg(googleUrl) : "";

    // Back instruction (actionable, replaces the redundant label + logo)
    const scanText = isEs ? "Escanea para calificarnos en Google" : "Scan to rate us on Google";

    const css = `
      /* ── Front ── */
      /* Three zones: brand top, star+CTA middle (flex-1 centered), flip-hint bottom */
      .gr-card { width:${asset.width}; height:${asset.height}; background:${c.bg}; display:flex; flex-direction:column; justify-content:space-between; padding:20px; page-break-after:always; }
      .gr-brand { display:flex; flex-direction:column; align-items:flex-start; }
      .gr-accent { width:28px; height:3px; background:#000000; margin-top:5px; }
      /* CTA zone — column, centered. Margin on individual elements controls hierarchy spacing:
         stars → headline gets 8 px (cross-group), headline → subhead gets 3 px (within-group) */
      .gr-cta { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; }
      .gr-headline { font-size:12px; font-weight:800; letter-spacing:0.04em; color:${c.name}; margin-top:8px; }
      .gr-subhead  { font-size:9px;  font-weight:400; color:${c.secondary}; margin-top:3px; }
      /* Flip hint — 8 px minimum for readable print, anchors to bottom */
      .gr-hint { font-size:8px; font-weight:400; color:${c.muted}; text-align:center; }

      /* ── Back ── */
      /* Three elements only — stars prime the action, QR is the hero, text confirms.
         Math: 14 + 8 + 106 + 8 + 10 = 146 px in 152 px content area (20 px padding). */
      .gr-back { width:${asset.width}; height:${asset.height}; background:${c.bg}; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; padding:20px; }
      /* Stars above QR: SVG geometry — no font/glyph dependency, safe in email */
      /* QR is the hero — sized to dominate without overflowing */
      .gr-qr { width:106px; height:106px; }
      .gr-qr svg { width:100%; height:100%; display:block; }
      /* Brief instruction below QR confirms the action */
      .gr-scan-text { font-size:8px; font-weight:500; color:${c.secondary}; text-align:center; }
    `;

    const frontHTML = `<div class="gr-card">
      <div class="gr-brand">
        ${logoImg(logoSrc, "32px", "130px")}
        <div class="gr-accent"></div>
      </div>
      <div class="gr-cta">
        ${fiveStarsSvg(22, STAR_COLOR)}
        <div class="gr-headline">${headline}</div>
        <div class="gr-subhead">${subhead}</div>
      </div>
      <div class="gr-hint">${flipHint}</div>
    </div>`;

    const qrPlaceholder = `<div style="width:106px;height:106px;border:1.5px dashed #ccc;display:flex;align-items:center;justify-content:center;font-size:8px;color:#aaa;text-align:center;line-height:1.4;">Enter Google<br>Review Link</div>`;

    const backHTML = `<div class="gr-back">
      ${fiveStarsSvg(14, STAR_COLOR)}
      <div class="gr-qr">${qr || qrPlaceholder}</div>
      <div class="gr-scan-text">${scanText}</div>
    </div>`;

    if (page === "front") return wrapWithFont(asset.width, asset.height, c.bg, css, frontHTML);
    if (page === "back")  return wrapWithFont(asset.width, asset.height, c.bg, css, backHTML);
    return wrapWithFont(asset.width, asset.height, c.bg, css, frontHTML + backHTML);
  };
}

reg("google-review", "light",    googleReviewCard("light"));
reg("google-review", "light-es", googleReviewCard("light-es"));

// ---------------------------------------------------------------------------
// ENVELOPES
// ---------------------------------------------------------------------------

function envelope(templateId: string): GenFn {
  return (opts) => {
    const { asset, fields } = opts;
    const { c } = themeFor(templateId);
    const { logoSrc } = assets(opts);
    return wrapWithFont(asset.width, asset.height, c.bg, `
      .env { width:${asset.width}; height:${asset.height}; background:${c.bg}; padding:28px 36px; position:relative; }
      /* Return-address block: logo → sender name → address, left-anchored top */
      .from { position:absolute; top:28px; left:36px; }
      /* from-name is quieter than the logo — it's detail, not identity */
      .from-name { font-size:11px; font-weight:700; letter-spacing:0.02em; color:${c.name}; margin-top:6px; margin-bottom:2px; }
      .from-addr { font-size:10px; font-weight:400; color:${c.detail}; line-height:1.65; white-space:pre-line; }
      /* Recipient block: fixed 55% down, true-centered with translate(-50%,-50%) */
      .to { position:absolute; top:55%; left:50%; transform:translate(-50%,-50%); text-align:center; }
      .to-name { font-size:14px; font-weight:800; letter-spacing:0.04em; color:${c.name}; margin-bottom:5px; }
      .to-addr { font-size:11px; font-weight:400; color:${c.detail}; line-height:1.7; white-space:pre-line; }
    `, `<div class="env">
      <div class="from">
        ${logoImg(logoSrc, "48px", "220px")}
        <div class="from-name">${esc(fields.fromName || "")}</div>
        <div class="from-addr">${esc(fields.fromAddress || "")}</div>
      </div>
      <div class="to">
        <div class="to-name">${esc(fields.toName || "")}</div>
        <div class="to-addr">${esc(fields.toAddress || "")}</div>
      </div>
    </div>`);
  };
}

reg("envelope", "light", envelope("light"));
reg("envelope", "light-es", envelope("light-es"));

// ---------------------------------------------------------------------------
// STICKERS
// ---------------------------------------------------------------------------

function sticker(templateId: string): GenFn {
  return (opts) => {
    const { asset, fields } = opts;
    const { c } = themeFor(templateId);
    const { logoSrc, iconSrc } = assets(opts);
    const tagline = resolveTagline(templateId, opts.tagline);
    const phone = fields.phone || "";
    return wrapWithFont(asset.width, asset.height, c.bg, `
      /* 16 px padding provides a print-safe inset inside the die-cut border */
      .sticker { width:${asset.width}; height:${asset.height}; background:${c.bg}; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; padding:16px; border:1.5px solid ${c.rule}; border-radius:8px; }
      /* Icon is the recognisable brand mark; logo wordmark sits just below it */
      .icon { max-height:56px; max-width:56px; object-fit:contain; }
      .logo { max-height:44px; max-width:210px; object-fit:contain; }
      .tagline { font-size:10px; font-weight:400; color:${c.secondary}; }
      /* Phone is the primary CTA on a sticker — heavier weight, extra tracking, clear air above */
      .phone { font-size:14px; font-weight:700; letter-spacing:0.04em; color:${c.name}; margin-top:4px; }
    `, `<div class="sticker">
      ${iconSrc ? `<img src="${iconSrc}" alt="Icon" class="icon">` : ""}
      ${logoSrc ? `<img src="${logoSrc}" alt="Logo" class="logo">` : ""}
      <div class="tagline">${esc(tagline)}</div>
      ${phone ? `<div class="phone">${esc(phone)}</div>` : ""}
    </div>`);
  };
}

reg("sticker", "light", sticker("light"));
reg("sticker", "light-es", sticker("light-es"));

// ---------------------------------------------------------------------------
// Fallback
// ---------------------------------------------------------------------------

function fallbackHTML({ asset, dark }: GenerateOptions): string {
  const c = dark ? P.dark : P.light;
  return wrap(asset.width, asset.height, c.bg, `
    .page { width:${asset.width}; height:${asset.height}; background:${c.bg}; display:flex; align-items:center; justify-content:center; }
    .msg { font-size:14px; color:${c.muted}; }
  `, `<div class="page"><p class="msg">Template preview not available</p></div>`);
}
