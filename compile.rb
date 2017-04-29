class Compiler

  def run
    @index_html = File.read('index.html')

    @index_html.each_line do |line|
      file = line[/<script src="(.*?)"/, 1]
      file ||= line[/<link rel="stylesheet" href="(.*?)"/, 1]
      cachebust(line, file) if file
    end

    File.write('index.html', @index_html)
  end

  private

  def cachebust(line, file)
    path = file.sub(/\?.*$/, '')
    timestamp = File.mtime(path).to_i
    new_line = line.sub(file, "#{path}?#{timestamp}")

    @index_html.sub!(line, new_line)
  end

end

Compiler.new.run
