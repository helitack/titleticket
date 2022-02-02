# titleticket

> Add jira ticket from the branch name to your PR titles

## Building/Publishing

> Ensure you have `ncc` installed: `npm i -g @vercel/ncc`

1. Compile `ncc build index.js --license licenses.txt`
1. Commit `git add --all && git commit -m ""`
1. Tag `git tag -a -m "" v1.1`
1. Push `git push --follow-tags`