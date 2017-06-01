class Compiler

  @@html_path = 'web/index.html'

  def run
    @index_html = File.read(@@html_path)

    @index_html.each_line do |line|
      file = line[/<script src="(.*?)"/, 1]
      file ||= line[/<link rel="stylesheet" href="(.*?)"/, 1]
      cachebust(line, file) if file
    end

    File.write(@@html_path, @index_html)
  end

  private

  def cachebust(line, file)
    # Skip firebase assets
    return if file =~ /__/

    # Strip trailing query string and leading slash
    path = file.sub(/\?.*$/, '').sub(/^\//, '')
    timestamp = File.mtime("web/#{path}").to_i
    new_line = line.sub(file, "/#{path}?#{timestamp}")

    @index_html.sub!(line, new_line)
  end

end

Compiler.new.run
