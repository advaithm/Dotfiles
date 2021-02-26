# Nullrequest's dotfiles
This a little repo I made to store my dotfiles. this is can be used alone or with my [auto-init](https://github.com/advaithm/auto_init) script, The auto-init script setups my development environment on Kde Plasma. The script installs my favorite theme, sets my wallpaper and my uses stow to set up my dotfiles.
you will need to following installed to allow you to use all the dotfiles here.
```
vim
neovim
zsh
neofetch
vscodium
```
you can use only one or two depending on what you like. This repo is intended to be used with [gnu stow](https://www.gnu.org/software/stow/) a nifty program that symlinks these files to the appropriate locations. to use stow to create these symlinks all you need to do is
```bash
stow vim neofetch vscode zsh
```
stow will do the rest and create the symlinks. for vim/neovim you will need to run the following to ensure everything works
```bash
git clone https://github.com/kristijanhusak/vim-packager ~/.vim/pack/packager/opt/vim-packager
git clone https://github.com/kristijanhusak/vim-packager ~/.config/nvim/pack/packager/opt/vim-packager
```
then finally in vim and nvim run `PackagerInstall` or `PackagerUpdate` on first run to sync all the dependencies required
