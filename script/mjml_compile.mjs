import mjml2html from "mjml";
import process from "node:process";

let input = "";

process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});

process.stdin.on("end", async () => {
  try {
    const result = await Promise.resolve(mjml2html(input, {
      keepComments: false,
      minify: false,
      validationLevel: "soft",
    }));

    process.stdout.write(
      JSON.stringify({
        html: result.html,
        errors: result.errors ?? [],
      })
    );
  } catch (error) {
    process.stderr.write(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exit(1);
  }
});

process.stdin.resume();
