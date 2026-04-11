# Architecture

## Goal

Provide a reusable editor runtime that multiple Worker SSR projects can import without copying Vietwork-specific CMS code.

## Package boundary

Inside package:

- TinyMCE bootstrapping
- shared toolbar registration
- inline source mode orchestration
- fullscreen behavior
- search state and navigation
- reusable formatters such as `linebold_yellow`

Outside package:

- TinyMCE file hosting
- app templates
- media library implementation
- route handlers
- i18n storage
- project CSS theme

## Import model

Recommended usage in Worker projects:

1. Host TinyMCE static assets under project-owned asset URLs.
2. Import this package in the browser module that powers your CMS page.
3. Pass project-specific selectors and URLs into `createClassicEditor`.

## Why this shape

Worker repos vary most in:

- asset paths
- server-rendered templates
- modal routing
- translation lookup

So the package should export browser runtime only, not server framework code.
