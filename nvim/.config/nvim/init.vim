" Packager
if &compatible
  set nocompatible
endif
function! s:packager_init(packager) abort
  " plugin manager
  call a:packager.add('kristijanhusak/vim-packager',{'type':'opt'})
  " theme
  call a:packager.add('Matt-Gleich/monovibrant', { 'branch': 'main' })
  " linter
  call a:packager.add('vim-syntastic/syntastic')
  " nerd tree file explorer
  call a:packager.add('preservim/nerdtree')
  " black formater
  call a:packager.add('psf/black', { 'branch': 'stable','type':'opt' })
  "cmake linting
  call a:packager.add('pboettch/vim-cmake-syntax',{'type':'opt'})
  " air line
  call a:packager.add('vim-airline/vim-airline')
  " air line themes
  call a:packager.add('vim-airline/vim-airline-themes',)
endfunction

packadd vim-packager
call packager#setup(function('s:packager_init'))
packadd nerdtree
" settings
set number
set tabstop=4
set foldenable
set foldmethod=indent

if has('termguicolors')
  set termguicolors
endif
" Load plugins only for specific filetype
augroup packager_filetype
  autocmd!
  " load black for python files
  autocmd FileType python packadd black
augroup END

syntax on
" syntastic stuff
set statusline+=%#warningmsg#
set statusline+=%{SyntasticStatuslineFlag()}
set statusline+=%*

let g:syntastic_always_populate_loc_list = 1
let g:syntastic_auto_loc_list = 1
let g:syntastic_check_on_open = 1
let g:syntastic_check_on_wq = 0

let g:airline_theme = 'base16color'
let g:airline_powerline_fonts = 1

set showmatch
colorscheme monovibrant
" show hiddden files nerdtree
let NERDTreeShowHidden=1
"start nerd tree drop cursor in other window
autocmd VimEnter * NERDTree | wincmd p
