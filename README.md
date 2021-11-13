# About

This project is developed for the non-profit organization [Meshiv Nefesh](https://5f353e7470044.site123.me/).
Its purpose is to create a convenient platform for respondents: to upload answers, read and confirm answers of others. And upload them automatically to the site after the required number of confirms.

The project backend developed with Firebase Functions.
## API
### Answers
#### /answers - GET
Returns an array of all the answers. <br/> Each answer has this props:
`answerId`
`body`
`userHandle`
`createdAt`
`userImage`
`confirmCount`
`commentCount`
#### /answer - POST
`authentication` - required <br/>
Uploading a new answer to the database <br/>
props: `body`
#### /answer/:answerId - GET
Fetch an answer from the database.
#### /answer/:answerId - DELETE
`authentication` - required <br/>
Deleting an answer from the database.
#### /answer/:answerId/comment - POST
`authentication` - required <br/>
Post a comment to an answer.<br/>
#### /answer/:answerId/confirm - POST
`authentication` - required <br/>
Confirm an answer.<br/>
Every user can confirm an answer once.
#### /answer/:answerId/unconfirm - POST
`authentication` - required <br/>
Unconfirm an answer.<br/>
### Users
#### /signup - POST
#### /login - POST
#### /user/image - POST
#### /user - GET
#### /user/:handle - GET
#### /notifications - POST