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
  " html
  call a:packager.add('othree/html5.vim',{'type':'opt'})
  " air line
  call a:packager.add('vim-airline/vim-airline')
  " air line themes
  call a:packager.add('vim-airline/vim-airline-themes')
  "markdown
  call a:packager.add('iamcco/markdown-preview.nvim', { 'do': 'cd app && yarn install'  })
  "python completions
  call a:packager.add('ncm2/ncm2')
  call a:packager.add('roxma/nvim-yarp')
  call a:packager.add('ncm2/ncm2-bufword')
  call a:packager.add('ncm2/ncm2-path')
  "jedi-vm
  call a:packager.add('davidhalter/jedi-vim')
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
  autocmd FileType python packadd black nmc2 'nvim-yarp'
  autocmd FileType cmake packadd 'vim-cmake-syntax'
  autocmd FileType html packadd 'html5.vim'
augroup END
map <C-A-p> <Plug>MarkdownPreviewToggle

syntax on
" syntastic status line
set statusline+=%#warningmsg#
set statusline+=%{SyntasticStatuslineFlag()}
set statusline+=%*
" syntastic configs
let g:syntastic_always_populate_loc_list = 1
let g:syntastic_auto_loc_list = 1
let g:syntastic_check_on_open = 1
let g:syntastic_check_on_wq = 1
let g:syntastic_python_checkers=['mypy','python']
"markdown preview
let g:mkdp_auto_start = 0
let g:mkdp_auto_close = 1
let g:mkdp_browser = 'firefox'
let g:mkdp_filetypes = ['markdown']
" airline
let g:airline#extensions#tabline#enabled = 1
let g:airline_theme = 'bubblegum'
let g:airline_powerline_fonts = 1

" enable ncm2 for all buffers
autocmd BufEnter * call ncm2#enable_for_buffer()

"jed-vim
let g:jedi#auto_initialization = 0
let g:jedi#use_tabs_not_buffers = 1
let g:jedi#show_call_signatures = "2"


" IMPORTANT: :help Ncm2PopupOpen for more information
set completeopt=noinsert,menuone,noselect

set showmatch
colorscheme monovibrant
" show hiddden files nerdtree
let g:NERDTreeShowHidden=1
"start nerd tree drop cursor in other window
autocmd VimEnter * NERDTree | wincmd p
