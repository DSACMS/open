# DSAC Open Source Website
> [!WARNING]
> This project is now archived and no longer actively maintained. It has been archived to retain its contents for reference. Feel free to explore and fork the repository, but please note that updates or support will not be provided.

> [!IMPORTANT]
> The [CMS OSPO Metrics Website](dsacms.github.io/metrics) is an alternate project that is actively maintained, containing similar functionality and information. Visit the repository at www.github.com/DSACMS/metrics

A static webpage containing various information about CMS open source repositories. This is originally the first iteration of metrics visualizations site.

## Setup

[Create a GitHub personal access token][pat] (both "classic" or "fine-grained"
OK; any token will do, don't grant it any permissions). Create a `.env` file
containing the following:

```
GITHUB_TOKEN=[token_here]
```

Then run:

```
npm install
npm start
```

[pat]: (https://github.com/settings/tokens)
