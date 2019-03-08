var links = [];

$(".server").each(function() {
  if ($(this).data("name") == 34) {
    $(this)
      .find("a")
      .each(function() {
        const id = $(this).data("id");
        links.push(`https://www2.9anime.to/ajax/episode/info?id=${id}`);
      });
  }
});

function getLink() {
  const l = links.pop();
  $.get(l, function(data) {
    console.log(data.target);
  });

  if (links.length != 0) getLink();
}

getLink();
