const fs = require("fs");
const request = require("request");
const cheerio = require("cheerio");

let OUTPUT_DIRECTORY = "";
const queue = [];

const prepareQueue = (show_name, start_episode, end_episode) => {
  if (start_episode == undefined) {
    if (show_name.indexOf("dramafast.com/movie/") != -1) queue.push(show_name);
  } else {
    for (let i = start_episode; i <= end_episode; i++) {
      // If it's a movie we just use the link, else we use the name and follow the pattern
      queue.push(`https://dramafast.com/show/${show_name}/episode-${i}/`);
    }
  }
};

const downloader = function(uri, filename, callback) {
  // make the filename not need a directory
  const file = filename.split("/")[filename.split("/").length - 1];

  console.log(`[Downloading: ${filename}]`);
  const r = request(uri).pipe(
    fs.createWriteStream(`${OUTPUT_DIRECTORY}/${file}.mp4`)
  );
  r.on("end", callback);
  r.on("error", err => {
    console.log(err);
  });
};

const check_queue = () => {
  if (queue.length != 0) {
    console.log(`[Queue: ${queue.length}]`);
    const next = queue.pop();
    mirror_page_extractor(next);
  } else {
    console.log("[Queue empty, stopping]");
  }
};

// Get download link from mirrors
const mirror_page_extractor = link => {
  request.get(link, (err, response, body) => {
    const $ = cheerio.load(body);
    const title = $("title").text();
    try {
      $("a").each(function() {
        const dl_link = $(this).attr("href");
        if (dl_link.indexOf("azvideo.net/file") != -1) {
          request.get(`http:${dl_link}`, function(e, r, b) {
            const $ = cheerio.load(b);
            $(".mirror_link")
              .find("a")
              .each(function() {
                if (
                  $(this)
                    .attr("href")
                    .indexOf("go.php" != -1)
                ) {
                  console.log($(this).attr("href"));

                  downloader($(this).attr("href"), title, () => {
                    console.log(`[Complete: ${title}]`);
                    check_queue();
                  });
                }
              });
          });
        }

        /*
        if (dl_link.indexOf("openload") != -1) {
          downloader(dl_link, title, () => {
            console.log(`[Complete: ${title}]`);
            check_queue();
          });
        } else {
          clipboardy.writeSync(dl_link);
          console.log(`[Copied to clipboard: ${dl_link}`);
          check_queue();
        }
        */
      });
    } catch (err) {
      console.log(err);
    }
  });
};

OUTPUT_DIRECTORY = process.argv[3];
if (process.argv.length == 6) {
  prepareQueue(process.argv[2], process.argv[4], process.argv[5]);
  mirror_page_extractor(queue.pop());
} else if (process.argv.length == 4) {
  prepareQueue(process.argv[2]);
  mirror_page_extractor(queue.pop());
} else {
  console.log(
    "Error! Please use the command like this\nnode index.js show_name output_path start_episode end_episode\nOr: node .index.js https://dramafast.com/movie/door-lock/watch/ F:/"
  );
}
