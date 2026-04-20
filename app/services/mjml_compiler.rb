require "json"
require "open3"

class MjmlCompiler
  class CompilationError < StandardError; end

  SCRIPT_PATH = Rails.root.join("script", "mjml_compile.mjs").freeze

  class << self
    def compile(mjml)
      stdout, stderr, status = Open3.capture3(
        "node",
        SCRIPT_PATH.to_s,
        stdin_data: mjml.to_s
      )

      raise CompilationError, stderr.presence || "MJML compilation failed" unless status.success?

      JSON.parse(stdout)
    rescue Errno::ENOENT
      raise CompilationError, "Node.js is not available in the current environment"
    rescue JSON::ParserError
      raise CompilationError, "MJML compiler returned an invalid response"
    end
  end
end
