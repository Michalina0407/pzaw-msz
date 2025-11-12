import express from "express";
import komentarze from "./models/komentarze.js";

const port = 8000;

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded());

app.get("/cards", (req, res) => {
  res.render("posty", {
    title: "Wybierz co chcesz skomentowac",
    posty: komentarze.getpostSummaries(),
  });
});

app.get("/cards/:post_id", (req, res) => {
  const post = komentarze.getpost(req.params.post_id);
  if (post != null) {
    res.render("post", {
      title: post.name,
      post,
    });
  } else {
    res.sendStatus(404);
  }
});


app.post("/cards/:post_id/new", (req, res) => {
  const post_id = req.params.post_id;
  if (!komentarze.haspost(post_id)) {
    res.sendStatus(404);
  } else {
    let card_data = {
      front: req.body.front,
      back: req.body.back,
    };
    var errors = komentarze.validateCardData(card_data);
    if (errors.length == 0) {
      komentarze.addCard(post_id, card_data);
      res.redirect(`/cards/${post_id}`);
    } else {
      res.status(400);
      res.render("new_card", {
        errors,
        title: "Nowa opinia",
        front: req.body.front,
        back: req.body.back,
        post: {
          id: post_id,
        },
      });
    }
  }
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});