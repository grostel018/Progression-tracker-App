FROM php:8.2-apache

RUN docker-php-ext-install pdo_mysql \
    && a2enmod rewrite \
    && sed -ri -e 's!/var/www/html!/var/www/html/public!g' /etc/apache2/sites-available/000-default.conf /etc/apache2/apache2.conf

WORKDIR /var/www/html

COPY . /var/www/html

RUN mkdir -p /var/www/html/var/sessions /var/www/html/var/logs \
    && chown -R www-data:www-data /var/www/html/var
