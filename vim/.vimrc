" Packager
if &compatible
  set nocompatible
endif
function! s:packager_init(packager) abort
  " plugin manager
  call a:packager.add('kristijanhusak/vim-packager',{'type':'opt'})
  " theme
  call a:packager.add('kaicataldo/material.vim', { 'branch': 'main' })
  " linter
  call a:packager.add('vim-syntastic/syntastic')
endfunction

packadd vim-packager
call packager#setup(function('s:packager_init'))

" settings
set number
set foldmethod=manual
set tabstop=4
if has('termguicolors')
  set termguicolors
endif

syntax on
" syntastic
set statusline+=%#warningmsg#
set statusline+=%{SyntasticStatuslineFlag()}
set statusline+=%*

let g:syntastic_always_populate_loc_list = 1
let g:syntastic_auto_loc_list = 1
let g:syntastic_check_on_open = 1
let g:syntastic_check_on_wq = 0


let g:material_theme_style = 'darker'
let g:material_terminal_italics = 1
colorscheme material 


