" Packager
if &compatible
  set nocompatible
endif
function! s:packager_init(packager) abort
  " plugin manager
  call a:packager.add('kristijanhusak/vim-packager', {'type':'opt'})
  " theme
  call a:packager.add('kaicataldo/material.vim', { 'branch': 'main' })
  " linter
  call a:packager.add('vim-syntastic/syntastic')
  " nerd tree file explorer
  call a:packager.add('preservim/nerdtree')
  "async linter 
  call a:packager.add('dense-analysis/ale')
  " black formater
  call a:packager.add('psf/black', { 'branch': 'stable','type':'opt' })
  " fzf search
  call a:packager.add('junegunn/fzf',{ 'do': { -> fzf#install() } })
  call a:packager.add('junegunn/fzf.vim')
  " tag bar, lsp
  call a:packager.add('liuchengxu/vista.vim')
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

" ale
let g:ale_linters = {
      \   'python': ['mypy']}

let g:material_theme_style = 'darker'
let g:material_terminal_italics = 1
colorscheme material 

nnoremap <space> za

"start nerd tree drop cursor in other window
autocmd VimEnter * NERDTree | wincmd p
