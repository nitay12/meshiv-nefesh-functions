# About

This project is developed for the non-profit organization [Meshiv Nefesh](https://5f353e7470044.site123.me/).
Its purpose is to create a convenient platform for respondents: to upload answers, read and confirm answers of others. And upload them automatically to the site after the required number of confirms.

The project backend developed with Firebase Functions.
## API
### Answers
`/answers` - returns an array of all the answers. Each answer has this structure:
`answerId`
`body`
`userHandle`
`createdAt`
`userImage`
`confirmCount`
`commentCount`