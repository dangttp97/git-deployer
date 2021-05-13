sudo git pull origin v1 &&
cd /home/dangttp1612/src/api-server &&
sudo dotnet publish -o /home/dangttp1612/src/publish &&
sudo systemctl restart default-netcore.service