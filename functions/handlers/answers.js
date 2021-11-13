const { db } = require("../util/admin");
exports.getAllAnswers = (req, res) => {
  db.collection("answers")
    .orderBy("createdAt", "desc")
    .get()
    .then((data) => {
      let answers = [];
      data.docs.forEach((doc) => {
        answers.push({
          answerId: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt,
          userImage: doc.data().userImage,
          confirmCount: doc.data().confirmCount,
          commentCount: doc.data().commentCount
        });
      });
      return res.json(answers);
    })
    .catch((err) => {
      console.error(err);
    });
};
// Post one answer
exports.postOneAnswer = (req, res) => {
  if (req.body.body.trim() === "")
  return res.status(400).json({ answer: "Must not be empty" });

  const newAnswer = {
    userHandle: req.user.handle,
    body: req.body.body,
    userImage: req.user.imageUrl,
    createdAt: new Date().toISOString(),
    confirmCount: 0,
    commentCount: 0,
  };

  db.collection("answers")
    .add(newAnswer)
    .then((doc) => {
      const resAnswer = newAnswer;
      resAnswer.answerId = doc.id;
      res.json({ resAnswer });
    })
    .catch((err) => {
      res.status(500).json({ error: "something went wrong" });
      console.error(err);
    });
};
// Fetch one answer
exports.getAnswer = (req, res) => {
  let answerData = {};
  db.doc(`/answers/${req.params.answerId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Answer not found" });
      }
      answerData = doc.data();
      answerData.answerId = doc.id;
      return db
        .collection("comments")
        .orderBy("createdAt", "desc")
        .where("answerId", "==", req.params.answerId)
        .get();
    })
    .then((data) => {
      answerData.comments = [];
      data.forEach((doc) => {
        answerData.comments.push(doc.data());
      });
      return res.json(answerData);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};
// Delete answer
exports.deleteAnswer = (req, res) => {
 const document = db.doc(`/answers/${req.params.answerId}`)
 document.get()
 .then(doc => {
   if(!doc.exists){
     res.status(404).json({error: 'Answer not found'});
   }
   if(doc.data().userHandle !== req.user.handle){
     return res.status(403).json({error: 'Unauthorized'});
   } else {
     return document.delete();
   }
 })
 .then(() => {
   res.json({message: 'Answer deleted successfully'});
 })
 .catch(err => {
   console.error(err);
   return res.status(500).json({ error: err.code })
 })
}; 

// Comment on an answer
exports.commentOnAnswer = (req, res) => {
  if (req.body.body.trim() === "")
    return res.status(400).json({ comment: "Must not be empty" });

  const newComment = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
    answerId: req.params.answerId,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl,
  };

  db.doc(`/answers/${req.params.answerId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        res.status(404).json({ error: "Answer not found" });
      }
      return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
    })
    .then(() => {
      return db.collection("comments").add(newComment);
    })
    .then(() => {
      res.json(newComment);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Something went wrong" });
    });
};
// Confirm an answer
exports.confirmAnswer = (req, res) => {
  const confirmDocument = db
    .collection("confirms")
    .where("userHandle", "==", req.user.handle)
    .where("answerId", "==", req.params.answerId)
    .limit(1);

  const answerDocument = db.doc(`/answers/${req.params.answerId}`);

  let answerData;

  answerDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        answerData = doc.data();
        answerData.answerId = doc.id;
        return confirmDocument.get();
      } else {
        return res.status(404).json({ error: "Answer not found" });
      }
    })
    .then((data) => {
      if (data.empty) {
        return db
          .collection("confirms")
          .add({
            answerId: req.params.answerId,
            userHandle: req.user.handle,
          })
          .then(() => {
            answerData.confirmCount++;
            return answerDocument.update({
              confirmCount: answerData.confirmCount,
            });
          })
          .then(() => {
            return res.json(answerData);
          });
      } else {
        return res.status(400).json({ error: "Answer already confirmed" });
      }
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
// Unconfirm an answer
exports.unconfirmAnswer = (req, res) => {
  const confirmDocument = db
    .collection("confirms")
    .where("userHandle", "==", req.user.handle)
    .where("answerId", "==", req.params.answerId)
    .limit(1);

  const answerDocument = db.doc(`/answers/${req.params.answerId}`);

  let answerData;

  answerDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        answerData = doc.data();
        answerData.answerId = doc.id;
        return confirmDocument.get();
      } else {
        return res.status(404).json({ error: "Answer not found" });
      }
    })
    .then((data) => {
      if (data.empty) {
        return res.status(400).json({ error: "Answer is not confirmed" });
      } else {
        return db
          .doc(`/confirms/${data.docs[0].id}`)
          .delete()
          .then(() => {
            answerData.confirmCount--;
            return answerDocument.update({
              confirmCount: answerData.confirmCount,
            });
          })
          .then(() => {
            return res.json(answerData);
          });
      }
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
