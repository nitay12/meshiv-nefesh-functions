const functions = require("firebase-functions");

const app = require("express")();

const FBAuth = require("./util/FBAuth");

const {
  getAllAnswers,
  postOneAnswer,
  getAnswer,
  deleteAnswer,
  commentOnAnswer,
  confirmAnswer,
  unconfirmAnswer,
} = require("./handlers/answers");

const {
  signup,
  login,
  uploadImage,
  getAuthenticatedUser,
  getUserData,
  markNotificationsRead,
} = require("./handlers/users");

const { db } = require("./util/admin");

//Answer routes
app.get("/answers", getAllAnswers);
app.post("/answer", FBAuth, postOneAnswer);
app.get("/answer/:answerId", getAnswer);
app.delete("/answer/:answerId", FBAuth, deleteAnswer);
app.post("/answer/:answerId/comment", FBAuth, commentOnAnswer);
app.get("/answer/:answerId/confirm", FBAuth, confirmAnswer);
app.get("/answer/:answerId/unconfirm", FBAuth, unconfirmAnswer);

//Users routes
app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image", FBAuth, uploadImage);
app.get("/user", FBAuth, getAuthenticatedUser);
app.get("/user/:handle", getUserData);
app.post("/notifications", FBAuth, markNotificationsRead);

exports.api = functions.region("asia-northeast3").https.onRequest(app);

exports.createNotificationOnConfirm = functions
  .region("asia-northeast3")
  .firestore.document("confirms/{id}")
  .onCreate((snapshot) => {
    return db
      .doc(`/answers/${snapshot.data().answerId}`)
      .get()
      .then((doc) => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: "confirm",
            read: false,
            answerId: doc.id,
          });
        }
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  });
exports.deleteNotificationOnUnconfirm = functions
  .region("asia-northeast3")
  .firestore.document("confirms/{id}")
  .onDelete((snapshot) => {
    return db
      .doc(`/notifications/${snapshot.id}`)
      .delete()
      .catch((err) => {
        console.error(err);
        return;
      });
  });
exports.createNotificationOnComment = functions
  .region("asia-northeast3")
  .firestore.document("comments/{id}")
  .onCreate((snapshot) => {
    return db
      .doc(`/answers/${snapshot.data().answerId}`)
      .get()
      .then((doc) => {
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            type: "comment",
            read: false,
            answerId: doc.id,
          });
        }
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  });

exports.onUserImageChange = functions
  .region("asia-northeast3")
  .firestore.document("/users/{userId}")
  .onUpdate((change) => {
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      let batch = db.batch();
      return db
        .collection("answers")
        .where("userHandle", "==", change.before.data().handle)
        .get()
        .then((data) => {
          data.forEach((doc) => {
            const answer = db.doc(`/answers/${doc.id}`);
            batch.update(answer, { userImage: change.after.data().imageUrl });
          });
          return batch.commit();
        });
    } else return true;
  });

exports.onAnswerDelete = functions
  .region("asia-northeast3")
  .firestore.document("/answers/{answerId}")
  .onDelete((snapshot, context) => {
    const answerId = context.params.answerId;
    const batch = db.batch();
    return db
      .collection("comments")
      .where("answerId", "==", answerId)
      .get()
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/comments/${doc.id}`));
        });
        return db
          .collection("confirms")
          .where("answerId", "==", answerId)
          .get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/confirms/${doc.id}`));
        });
        return db
          .collection("notifications")
          .where("answerId", "==", answerId)
          .get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
      })
      .catch((err) => {
        console.error(err);
      });
  });
