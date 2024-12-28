#ARG RUBY_VERSION
FROM ruby:3.3.5

ARG APP_ENV=production

ARG PG_MAJOR
ARG NODE_MAJOR=18
ARG BUNDLER_VERSION=2.2.15
ARG YARN_VERSION=1.22.19

# Copy Installers
RUN mkdir -p /docker-files
COPY .docker-files/ /docker-files
RUN chmod +x /docker-files/*.sh

# Install Dependencies
RUN /docker-files/deps.sh

# Install PostgreSQL
RUN /docker-files/pg.sh

# Install NodeJS, Yarn
RUN /docker-files/node.sh


# Configure bundler
ENV LANG=C.UTF-8 BUNDLE_JOBS=4 BUNDLE_RETRY=3

# Uncomment this line if you want to run binstubs without prefixing with `bin/` or `bundle exec`
# ENV PATH=/app/bin:$BUNDLE_BIN:$PATH

# Upgrade RubyGems and install required Bundler version
RUN gem update --system && \
  gem install bundler:$BUNDLER_VERSION

# Change permissions for GEM_HOME
RUN chmod -R 777 $GEM_HOME

# Add docker user
RUN adduser --disabled-password --gecos "" docker && adduser docker staff

# Create and change app directory permissions
RUN mkdir /usr/src/app
RUN chown -R docker:docker /usr/src/app


# Bundler install gems
WORKDIR /tmp
COPY Gemfile Gemfile.lock /tmp/

COPY ./backstage /tmp/backstage
# RUN bundle config set force_ruby_platform true
RUN bundle install -j ${BUNDLE_JOBS} --retry ${BUNDLE_RETRY}

COPY --from=mwader/static-ffmpeg:4.1.4-2 /ffmpeg /ffprobe /usr/local/bin/


RUN apt-get update && \
  wget https://github.com/bbc/audiowaveform/releases/download/1.8.1/audiowaveform_1.8.1-1-12_amd64.deb && \
  dpkg -i audiowaveform_1.8.1-1-12_amd64.deb || true && \
  apt-get -f install -y


# Clean up APT when done
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* && \
  truncate -s 0 /var/log/*log

# Ensure setuid and setgid permissions are removed
RUN find / -perm /6000 -type f -exec chmod a-s {} \; || true

# Change user and set workdir
USER docker
WORKDIR /usr/src/app

# Copy app source into container
COPY --chown=docker:docker . /usr/src/app/

RUN yarn --version

RUN yarn install

# Precompile assets - production only
# Clean up temp files and Yarn cache folder
RUN NODE_OPTIONS="--max-old-space-size=2048" \
  RAILS_ENV=${APP_ENV} \
  DB_ADAPTER=nulldb \
  AWS_S3_BUCKET=aaa \
  AWS_ACCESS_KEY_ID=aaaa \
  AWS_SECRET_ACCESS_KEY=aaa \
  AWS_S3_REGION=aaa \
  SECRET_KEY_BASE=`bin/rails secret` \
  bundle exec rails assets:precompile --trace \
  && echo "done!"

# yarn cache clean
