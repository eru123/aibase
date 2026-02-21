FROM php:8.4-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    ca-certificates \
    gnupg \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    libicu-dev \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    libwebp-dev \
    libxpm-dev \
    libpq-dev \
    libsqlite3-dev \
    libssl-dev \
    libcurl4-openssl-dev \
    libbz2-dev \
    libgmp-dev \
    libldap2-dev \
    libsnmp-dev \
    libxslt1-dev \
    libtidy-dev \
    libenchant-2-dev \
    libsodium-dev \
    libargon2-dev \
    libreadline-dev \
    libedit-dev \
    libffi-dev \
    libkrb5-dev \
    unixodbc-dev \
    freetds-dev \
    librabbitmq-dev \
    libmemcached-dev \
    libmagickwand-dev \
    libyaml-dev \
    librdkafka-dev \
    zip \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js and pnpm
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable pnpm

# Configure PHP extensions with proper architecture detection
RUN ARCH=$(uname -m) \
    && if [ "$ARCH" = "x86_64" ]; then LIBDIR="lib/x86_64-linux-gnu"; \
       elif [ "$ARCH" = "aarch64" ]; then LIBDIR="lib/aarch64-linux-gnu"; \
       else LIBDIR="lib"; fi \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp --with-xpm \
    && docker-php-ext-configure ldap --with-libdir=$LIBDIR \
    && docker-php-ext-configure pgsql -with-pgsql=/usr/local/pgsql

# Install PHP extensions
RUN docker-php-ext-install -j$(nproc) \
    bcmath \
    bz2 \
    calendar \
    dba \
    exif \
    ffi \
    ftp \
    gd \
    gettext \
    gmp \
    intl \
    ldap \
    mbstring \
    mysqli \
    opcache \
    pcntl \
    pdo \
    pdo_mysql \
    pdo_pgsql \
    pgsql \
    shmop \
    snmp \
    soap \
    sockets \
    sodium \
    sysvmsg \
    sysvsem \
    sysvshm \
    tidy \
    xml \
    xsl \
    zip

# Install PECL extensions
RUN pecl install \
    apcu \
    igbinary \
    msgpack \
    redis \
    memcached \
    imagick \
    yaml \
    mongodb \
    xdebug \
    rdkafka \
    && docker-php-ext-enable \
    apcu \
    igbinary \
    msgpack \
    redis \
    memcached \
    imagick \
    yaml \
    mongodb \
    xdebug \
    rdkafka

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Enable Apache modules
RUN a2enmod rewrite

# Set ServerName to suppress Apache warning
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf

# Set working directory
WORKDIR /var/www/html
