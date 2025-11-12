const kom_posty = {
  "kiciaczek": {
    name: "kicia-kocia",
    cards: [
      { front: "uzytkownik1", back: "super!" },
      { front: "maciek", back: "nie podobalo mi sie" },
      { front: "tomek", back: "bylo ok" },
    ],
  },
  "podroze": {
    name: "pozdroze_male_i_duze",
    cards: [
      { front: "uzytkownik 2", back: "poznalem tam milosc zycia" },
      { front: "franek", back: "polecam wycieczke do Radomia" },
      { front: "julka", back: "nie zdazylam zobaczyc wiezy ajfla" },
    ],
  },
  "jedzenie": {
    name: "gdzie_zjesc",
    cards: [
      { front: "uzytkownik 3", back: "kocham restauracje bytom" },
      { front: "olek", back: "w kfc byla fatalna obsluga" },
      { front: "maja", back: "komentarz wyzej klamie, kfc jest super" },
    ],
  },
};

export function getpostSummaries() {
  return Object.entries(kom_posty).map(([id, post]) => {
    return { id, name: post.name };
  });
}

export function haspost(postId) {
  return kom_posty.hasOwnProperty(postId);
}

export function getpost(postId) {
  if (haspost(postId))
    return { id: postId, ...kom_posty[postId] };
  return null;
}

export function addCard(postId, card) {
  if (haspost(postId)) kom_posty[postId].cards.push(card);
}

export function validateCardData(card) {
  var errors = [];
  var fields = ["front", "back"];
  for (let field of fields) {
    if (!card.hasOwnProperty(field)) errors.push(`Missing field '${field}'`);
    else {
      if (typeof card[field] != "string")
        errors.push(`'${field}' expected to be string`);
      else {
        if (card[field].length < 1 || card[field].length > 500)
          errors.push(`'${field}' expected length: 1-500`);
      }
    }
  }
  return errors;
}

export default {
  getpostSummaries,
  haspost,
  getpost,
  addCard,
  validateCardData,
};