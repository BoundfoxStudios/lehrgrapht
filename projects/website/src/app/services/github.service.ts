import {
  inject,
  Injectable,
  makeStateKey,
  PLATFORM_ID,
  TransferState,
} from '@angular/core';
import { Octokit } from 'octokit';
import { isPlatformBrowser } from '@angular/common';

const cachedIssuesKey = makeStateKey<GitHubIssues>('cached-issues');

export interface GitHubIssue {
  id: string;
  title: string;
  url: string;
  createdAt: Date;
  body: string;
  comments: number;
  reactions: number;
  isBug: boolean;
  isFeature: boolean;
}

export interface GitHubIssues {
  totalCount: number;
  issues: GitHubIssue[];
}

@Injectable({ providedIn: 'root' })
export class GitHubService {
  private readonly transferState = inject(TransferState);
  private readonly platform = inject(PLATFORM_ID);

  private octokit?: Octokit;

  initialize(githubToken: string): void {
    this.octokit = new Octokit({ auth: githubToken });
  }

  async getCachedIssues(): Promise<GitHubIssues> {
    if (isPlatformBrowser(this.platform)) {
      return this.transferState.get(cachedIssuesKey, {
        totalCount: 0,
        issues: [],
      });
    }

    if (!this.octokit) {
      return { totalCount: 0, issues: [] };
    }

    const response = await this.octokit.graphql<{
      repository: {
        issues: {
          totalCount: number;
          edges: [
            {
              node: {
                id: string;
                bodyText: string;
                createdAt: string;
                title: string;
                url: string;
                reactions: {
                  totalCount: number;
                };
                comments: {
                  totalCount: number;
                };
                labels: {
                  edges: [
                    {
                      node: {
                        name: string;
                      };
                    },
                  ];
                };
              };
            },
          ];
        };
      };
    }>(`
query {
  repository(owner: "BoundfoxStudios", name: "lehrgrapht") {
    issues(
      labels: ["enhancement", "bug"]
      first: 10
      orderBy: { direction: DESC, field: UPDATED_AT }
      states: [OPEN]
    ) {
      totalCount
      edges {
        node {
          id
          bodyText
          createdAt
          title
          url

          reactions {
            totalCount
          }
          comments {
            totalCount
          }
          labels(first: 100) {
            totalCount
            edges {
              node {
                name
              }
            }
          }
        }
      }
    }
  }
}
    `);

    const result = {
      totalCount: response.repository.issues.totalCount,
      issues: response.repository.issues.edges.map(({ node }) => ({
        id: node.id,
        title: node.title,
        url: node.url,
        createdAt: new Date(node.createdAt),
        body: node.bodyText,
        comments: node.comments.totalCount,
        reactions: node.reactions.totalCount,
        isBug: node.labels.edges.some(({ node }) => node.name === 'bug'),
        isFeature: node.labels.edges.some(
          ({ node }) => node.name === 'enhancement',
        ),
      })),
    };

    this.transferState.set(cachedIssuesKey, result);

    return result;
  }
}

export const githubServiceAppInitializer = (): Promise<boolean> => {
  const githubToken = process.env['LEHRGRAPHT_WEBSITE_GITHUB_TOKEN'];
  const gitHubService = inject(GitHubService);

  if (githubToken) {
    gitHubService.initialize(githubToken);
  }

  return Promise.resolve(true);
};
