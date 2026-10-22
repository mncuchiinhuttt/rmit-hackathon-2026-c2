# Challenge 2 brief: vibe code a working app with TideCloak

Read on 2026-10-22 from three sources: the organiser "Submission guidelines" slide (photographed at the venue), the Google Form the slide links to, and the sample repository the slide links to. None of them states an app topic, judging criteria or scoring weights.

## Submission rules

| Item | Requirement | Source |
|---|---|---|
| Task | Vibe code a working app with TideCloak | Slide |
| Deliverable | One GitHub repository link containing source code, README and video files | Slide |
| Repository visibility | Public (the form asks for "Your public GitHub repository") | Form |
| Submit via | https://forms.gle/HRHYjnqB86j1LFS97 (opens "RMIT Hackathon 2026 - Challenge 2") | Slide |
| Form fields, all required | Group name; team email addresses (example `s12345678@rmit.edu.vn; s23456789@rmit.edu.vn`); GitHub repository URL | Form |
| Group name format | `<university>_<campus>_<team>_C2`, campus one of `SGS`, `HNI`, `MEL`, `MYS` | Slide, form |
| Deadline | 22/10/2026 18:00 (VN), same as Challenge 1 | Slide |
| Sample | https://github.com/truongnguyenxuanvinh/hackathon | Slide |

Group name for this team: `RMIT_SGS_Gay_Hackers_C2`. It is derived from the Challenge 1 notebook name `RMIT_SGS_Gay_Hackers_C1`; confirm it before submitting.

## What the sample repository shows

Read from `truongnguyenxuanvinh/hackathon` (public; the app is called `fairenrol`):

- Root files: `README.md`, `Video.mp4` (14 MB, committed in the repository), `package.json`, `index.html`, `vite.config.js`, `src/`, `public/`.
- Stack: Vite 6, React 19, `@tidecloak/react` ^0.14.33.
- README layout: "Built with TideCloak" badge, one-sentence project overview, five numbered sections, then Setup. The section prompts, taken from the comments in the sample:
  1. **Vision & originality**: what new product, service, experience or way of working is proposed; what makes it distinctive.
  2. **Trust constraint insight**: what is difficult, risky or impossible today because trust, privacy or security gets in the way; what becomes possible when that constraint is removed.
  3. **Value & impact**: who benefits and how; a concrete example of why it matters.
  4. **Why TideCloak matters**: how the app uses TideCloak and how that integration enables the idea.
  5. **Prototype & storytelling**: what the prototype demonstrates today; the key interaction judges should look for.
- Setup in the sample: open Docker, run `docker run -d -p 8080:8080 -e KC_BOOTSTRAP_ADMIN_USERNAME=admin -e KC_BOOTSTRAP_ADMIN_PASSWORD=password tideorg/tidecloak-dev:latest`, open http://localhost:8080/, create the app and set its URIs, download `tidecloak.json` into `public/`, install and run, click "Login with TideCloak".

[INFERENCE] The five README sections probably mirror the judging criteria; the slide does not say so.

## Risks

- The repository was created private. The form requires a public one, so make it public before submitting: `gh repo edit mncuchiinhuttt/rmit-hackathon-2026-c2 --visibility public --accept-visibility-change-consequences`.
- The video has to live in the repository. GitHub rejects any file over 100 MB (and warns above 50 MB); keep the recording small or use Git LFS.
- The TideCloak dev server needs a running container runtime; Docker Desktop is not required (see "TideCloak dev server").

## TideCloak dev server

`tideorg/tidecloak-dev:latest` is multi-arch (amd64, arm64), so runtimes on Apple silicon run it natively, without emulation. Publish it on localhost only: the admin password is the default `password`.

Apple `container` (macOS 26; start and run verified 2026-10-22):

```sh
container system start --enable-kernel-install
container run -d --name mytidecloak -c 2 -m 2G -p 127.0.0.1:8080:8080 \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin -e KC_BOOTSTRAP_ADMIN_PASSWORD=password \
  docker.io/tideorg/tidecloak-dev:latest
```

With Docker, Colima or Podman use the same flags with `docker run` / `podman run`. The server is up when http://localhost:8080/realms/myrealm/tide-console/ returns 200. Stop it with `container stop mytidecloak`, resume with `container start mytidecloak`.

## TideCloak references

- Getting started: https://docs.tide.org/get-started/
- Quickstart (dev server): https://docs.tide.org/get-started/Tidecloak%20Quickstart
- React SDK: https://docs.tide.org/Languages/React/tidecloak-react-intro
- JavaScript SDK: https://docs.tide.org/Languages/JavaScript/tidecloak-js-intro
- Next.js SDK: https://docs.tide.org/Languages/NextJS/tidecloak-nextjs-intro
- Core concepts: https://docs.tide.org/Core-Concepts/core-concepts

## Checklist

- [ ] App idea chosen and mapped to README sections 1-4
- [ ] TideCloak dev server running, client created, `tidecloak.json` in the app
- [ ] Login with TideCloak working end to end
- [ ] README rewritten in the sample's layout (badge, overview, sections 1-5, Setup)
- [ ] Demo video committed to the repository (under 100 MB)
- [ ] Repository made public
- [ ] Form submitted before 18:00 VN with group name, team emails and repository URL
