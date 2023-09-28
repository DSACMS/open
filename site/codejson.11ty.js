class CodeJson {
  data() {
    return {
      permalink: "code.json",
    }
  }

  render({ repos }) {
    return JSON.stringify({
      version: "2.0.0",
      measurementType: {},
      agency: "HHS",
      releases: repos.repos.map((repo) => ({
        name: repo.name,
        organization: "CMS",
        description: repo.description || "",
        permissions: {
          usageType: "openSource",
          licenses:
            repo.licenseInfo?.spdxId && repo.licenseInfo.spdxId != "NOASSERTION"
              ? [{ name: repo.licenseInfo.spdxId }]
              : null,
        },
        tags: (repo.category ? [repo.category] : []).concat(
          repo.repositoryTopics.nodes.map((node) => node.topic.name)
        ),
        contact: { email: "opensource@cms.hhs.gov" },
        vcs: "git",
        repositoryURL: `https://github.com/${repo.owner.login}/${repo.name}.git`,
        homepageURL:
          repo.homepageUrl && repo.homepageUrl != ""
            ? repo.homepageUrl
            : undefined,
        langauges: repo.languages.nodes.map((x) => x.name),
        // supposedly a required field; most others seem to just be reporting 0 here
        // ideally we would be making a calculation from lines of code
        laborHours: 0.0,
        relatedCode:
          repo.otherRepos &&
          repo.otherRepos.map((other) => ({
            name: other,
            URL: `https://github.com/${other}`,
            isGovernmentRepo: true,
          })),
        date: {
          created: repo.createdAt,
          lastModified: repo.pushedAt,
        },
      })),
    })
  }
}

module.exports = CodeJson
