require("dotenv").config()
let graphql = require("@octokit/graphql").graphql.defaults({
  headers: { authorization: `token ${process.env.GITHUB_TOKEN}` },
})
const { AssetCache } = require("@11ty/eleventy-fetch")

async function reposForOrg(org) {
  let asset = new AssetCache(`github_org_${org}`)
  if (asset.isCacheValid("1h")) {
    // we modify data in place later, so deep-copy it before returning it to keep
    // the cached copy pristine
    return JSON.parse(JSON.stringify(await asset.getCachedValue()))
  }

  async function doQuery(org, after) {
    return await graphql(
      `
        query ($org: String!, $after: String) {
          organization(login: $org) {
            repositories(
              first: 100
              after: $after
              orderBy: { field: STARGAZERS, direction: DESC }
            ) {
              nodes {
                name
                description
                stargazerCount
                homepageUrl
                owner {
                  login
                }
                isArchived
                isFork
                isEmpty
              }
              pageInfo {
                endCursor
                hasNextPage
              }
            }
          }
        }
      `,
      { org, after }
    )
  }

  let out = await doQuery(org, null)

  let repos = out.organization.repositories.nodes

  while (out.organization.repositories.pageInfo.hasNextPage) {
    out = await doQuery(org, out.organization.repositories.pageInfo.endCursor)
    repos = repos.concat(out.organization.repositories.nodes)
  }

  await asset.save(repos, "json")

  // we modify data in place later, so deep-copy it before returning it to keep
  // the cached copy pristine
  return JSON.parse(JSON.stringify(repos))
}

let orgs = [
  "CMSGov",
  "CMS-Enterprise",
  "DSACMS",
  "Enterprise-CMCS",
  "MeasureAuthoringTool",
  "MITA-Governance-Board",
  "projectcypress",
  "projecttacoma",
]

const categories = {
  apis: { name: "APIs", color: "red" },
  apps: { name: "Apps", color: "blue" },
  data: { name: "Data", color: "orange" },
  docs: { name: "Docs", color: "mint" },
  libraries: { name: "Libraries", color: "magenta" },
  standards: { name: "Standards", color: "gold" },
  // Rough distinction: an app is primarily targeted at end users, while a tool
  // is targeted at technical users. If it has no GUI, it's almost certainly a
  // tool, but beyond that it gets a little fuzzy. Some things could go both
  // ways.
  tools: { name: "Tools", color: "green" },
}

const manualOverrides = {
  "CMSgov/price-transparency-guide": { category: "standards" },
  "CMSgov/design-system": { category: "libraries" },
  "CMSgov/HealthCare.gov-Styleguide": { hide: true }, // deprecated, replaced by design-system
  "CMSgov/qpp-measures-data": {
    description:
      "The source of truth for Quality Payment Program measures data.",
    category: "data",
  },
  "CMSgov/beneficiary-fhir-data": {
    description:
      "An internal backend system used at CMS to represent Medicare beneficiaries' demographic, enrollment, and claims data in FHIR format.",
    category: "apis",
  },
  "CMSgov/QHP-provider-formulary-APIs": {
    description:
      "A set of schemas describing a data format (encoded as JSON) that lists which health care providers and drug formularies are covered by Qualified Health Plans (QHPs) on the federal health insurance marketplace.",
    category: "standards",
  },
  "Enterprise-CMCS/eAPD": {
    description:
      "This project aims to create a user-friendly, modern product to streamline the creation, submission, review, and approval of Medicaid Advance Planning Documents and their associated contract documents.",
    category: "apps",
  },
  "CMSgov/dpc-app": {
    description:
      "As patients move throughout the healthcare system, providers often struggle to gain and maintain a complete picture of their patients’ medical history. Data at the Point of Care (DPC) aims to fill these gaps in care by providing Medicare Fee-For-Service claims data to providers in a structured and standardized format.",
    category: "apis",
  },
  "CMSgov/bcda-app": {
    description:
      "The Beneficiary Claims Data API (BCDA) enables Accountable Care Organizations (ACOs) to retrieve Medicare Part A, Part B, and Part D claims data for their assigned beneficiaries.",
    category: "apis",
  },
  "CMSgov/bluebutton-web-server": {
    description:
      "A developer-friendly, standards-based API that enables Medicare beneficiaries to connect their claims data to applications, services and research programs they trust.",
    category: "apis",
  },
  "CMS-Enterprise/easi-app": {
    homepageUrl: "https://easi.cms.gov",
    description:
      "EASi is a web application supporting the IT governance process at CMS.",
    category: "apps",
  },
  "Enterprise-CMCS/macpro-quickstart-serverless": {
    description:
      "Template for a serverless form submission application, built and deployed to AWS with the Serverless Application Framework.",
    category: "libraries", // TODO: "templates" category? or other?
  },
  "CMS-Enterprise/sbom-harbor": {
    description:
      "A system for collecting, categorizing, storing, and analyzing software bills of materials (SBOMs).",
    category: "apps", // TODO: or tools?
  },
  "CMSgov/T-MSIS-Data-Quality-Measures-Generation-Code": {
    description:
      "Tools to measure data quality in the Transformed Medicaid Statistical Information System (T-MSIS).",
    category: "tools", // TODO: or data science?
  },
  "CMSgov/bluebutton-web-deployment": {
    mergeInto: "CMSgov/bluebutton-web-server",
  },
  "CMSgov/CMCS-DSG-DSS-Certification-Staging": {
    mergeInto: "CMSgov/CMCS-DSG-DSS-Certification",
  },
  "CMSgov/CMCS-DSG-DSS-Certification": {
    description:
      "A space for states, CMS, and vendors to learn, share, and contribute information about the Medicare Enterprise Systems Certification process and its related artifacts.",
    category: "docs",
  },
  "CMSgov/dpc-static-site": { mergeInto: "CMSgov/dpc-app" },
  "Enterprise-CMCS/managed-care-review": {
    description:
      "Managed Care Review is an application that accepts Managed Care contract and rate submissions from states and packages them for review by CMS.",
    category: "apps",
  },
  "CMSgov/T-MSIS-Analytic-File-Generation-Code": {
    description:
      "Code used to generate CMS' interim T-MSIS Analytic Files (TAF). These new TAF data sets exist alongside the Transformed Medicaid Statistical Information System and serve as an alternate data source tailored to meet the broad research needs of the Medicaid and CHIP data user community.",
    category: "tools", // TODO: or data science
  },
  "CMSgov/heimdall-lite.cms.gov": { hide: true }, // just GHA/Pages glue
  "CMSgov/AB2D-Libs": { mergeInto: "CMSgov/ab2d" }, // caps means the pattern below doesn't get it
  "CMSgov/ab2d": {
    description:
      "The AB2D API provides Medicare part D Prescription Drug Sponsors with secure Medicare parts A and B claims data for their plan enrollees.",
    category: "apis",
  },
  "CMSgov/bcda-ssas-app": { mergeInto: "CMSgov/bcda-app" },
  "CMS-Enterprise/sbom-harbor-ui": { mergeInto: "CMS-Enterprise/sbom-harbor" },
  "CMSgov/easi-shared": {
    description: "Shared code used by MINT and EASi.",
    category: "libraries",
  },
  "CMSgov/qpp-conversion-tool": { category: "tools" },
  "CMSgov/price-transparency-guide-validator": { category: "tools" },
  "CMSgov/ars-machine-readable": { category: "data" },
  "Enterprise-CMCS/cmcs-eregulations": { category: "apps" },
  "Enterprise-CMCS/macpro-ux-lib": { category: "libraries" },
  "MeasureAuthoringTool/madie-root": {
    description:
      "The Measure Authoring Development Integrated Environment (MADiE) allows users to develop and test measures in an integrated workspace.",
    category: "apps",
  },
  "MeasureAuthoringTool/madie-patient": {
    mergeInto: "MeasureAuthoringTool/madie-root",
  },
  "MeasureAuthoringTool/madie-rest-commons": {
    mergeInto: "MeasureAuthoringTool/madie-root",
  },
  "MeasureAuthoringTool/madie-fhir-service": {
    mergeInto: "MeasureAuthoringTool/madie-root",
  },
  "MeasureAuthoringTool/madie-cypress": {
    mergeInto: "MeasureAuthoringTool/madie-root",
  },
  "MeasureAuthoringTool/madie-measure": {
    mergeInto: "MeasureAuthoringTool/madie-root",
  },
  "MeasureAuthoringTool/madie-java-models": {
    mergeInto: "MeasureAuthoringTool/madie-root",
  },
  "MeasureAuthoringTool/madie-cql-library": {
    mergeInto: "MeasureAuthoringTool/madie-root",
  },
  "MeasureAuthoringTool/madie-editor": {
    mergeInto: "MeasureAuthoringTool/madie-root",
  },
  "MeasureAuthoringTool/madie-auth": {
    mergeInto: "MeasureAuthoringTool/madie-root",
  },
  "MeasureAuthoringTool/madie-layout": {
    mergeInto: "MeasureAuthoringTool/madie-root",
  },
  "MeasureAuthoringTool/madie-components": {
    mergeInto: "MeasureAuthoringTool/madie-root",
  },
  "MeasureAuthoringTool/madie-models": {
    mergeInto: "MeasureAuthoringTool/madie-root",
  },
  "MeasureAuthoringTool/madie-util": {
    mergeInto: "MeasureAuthoringTool/madie-root",
  },
  "MeasureAuthoringTool/madie-public": {
    mergeInto: "MeasureAuthoringTool/madie-root",
  },
  "MeasureAuthoringTool/madie-frontend-template": {
    mergeInto: "MeasureAuthoringTool/madie-root",
  },
  "MeasureAuthoringTool/madie-server-commons": {
    mergeInto: "MeasureAuthoringTool/madie-root",
  },
  "MeasureAuthoringTool/MeasureAuthoringTool": {
    category: "apps",
    description:
      "The Measure Authoring Tool (MAT) is a web-based tool that allows measure developers to author electronic Clinical Quality Measures (eCQMs).",
    homepageUrl: "https://www.emeasuretool.cms.gov",
  },
  "MeasureAuthoringTool/bonnie": {
    category: "apps",
    description:
      "Bonnie is a software tool that allows electronic clinical quality measure (eCQM) developers to test and verify the behavior of their eCQM logic.",
  },
  "projectcypress/cypress": {
    category: "tools"
  }
}

module.exports = async () => {
  try {
    let repos = (await Promise.all(orgs.map((org) => reposForOrg(org)))).flat()
    // sort by stars across all orgs
    repos.sort((a, b) => b.stargazerCount - a.stargazerCount)

    Object.keys(manualOverrides).forEach((path) => {
      const [org, repo] = path.split("/")
      const repoData = repos.find((x) => x.owner.login == org && x.name == repo)
      if (repoData) {
        Object.assign(repoData, manualOverrides[path])
      }
    })

    repos.forEach((repo) => {
      if (
        repo.homepageUrl ==
        `https://github.com/${repo.owner.login}/${repo.name}`
      ) {
        // filter out "website" links that are just a link back to the github repo
        repo.homepageUrl = undefined
      }

      if (repo.name.startsWith("cms-ars-")) {
        // 60+ repos across CMSgov and CMS-Enterprise - this seems as good a
        // place as any to merge them into
        repo.mergeInto = "CMSgov/saf"
      }
      if (repo.name.startsWith("ab2d-")) {
        repo.mergeInto = "CMSgov/ab2d"
      }

      if (repo.name == ".github") {
        // .github repos aren't interesting in and of themselves
        repo.hide = true
      }

      if (repo.mergeInto) {
        let [o, r] = repo.mergeInto.split("/")
        const target = repos.find((x) => x.owner.login == o && x.name == r)
        target.otherRepos = target.otherRepos || []
        target.otherRepos.push(`${repo.owner.login}/${repo.name}`)
        target.stargazerCount = Math.max(
          target.stargazerCount,
          repo.stargazerCount
        )
      }

      if (repo.category) {
        repo.categoryName = categories[repo.category].name
        repo.categoryColor = categories[repo.category].color
      }
    })

    repos = repos.filter(
      (repo) =>
        !repo.isArchived &&
        !repo.isFork &&
        !repo.isEmpty &&
        !repo.mergeInto &&
        !repo.hide
    )

    return {
      repos,
    }
  } catch (e) {
    console.error(e)
    return { repos: [] }
  }
}
