# deploy traefik

```sh
# install traefik...
# https://doc.traefik.io/traefik/getting-started/install-traefik/#use-the-binary-distribution

# deploy traefik ...
sudo setcap 'cap_net_bind_service=+ep' /usr/local/bin/traefik

sudo groupadd -g 321 traefik
sudo useradd \
  -g traefik --no-user-group \
  --home-dir /var/www --no-create-home \
  --shell /usr/sbin/nologin \
  --system --uid 321 traefik

sudo mkdir /etc/traefik
sudo mkdir /etc/traefik/acme
sudo mkdir /etc/traefik/providers
sudo chown -R root:root /etc/traefik
sudo chown -R traefik:traefik /etc/traefik/acme

# generate traefik config
cd ..
yarn cli:cluster:update_traefik_config
cd <this dir>
# end

# deploy traefik ...
sudo cp traefik.yml /etc/traefik/
sudo cp providers/* /etc/traefik/providers/

sudo cp traefik.service /etc/systemd/system/
sudo chown root:root /etc/systemd/system/traefik.service
sudo chmod 644 /etc/systemd/system/traefik.service
sudo systemctl daemon-reload
sudo systemctl start traefik.service
sudo systemctl enable traefik.service
sudo systemctl status traefik.service
```
