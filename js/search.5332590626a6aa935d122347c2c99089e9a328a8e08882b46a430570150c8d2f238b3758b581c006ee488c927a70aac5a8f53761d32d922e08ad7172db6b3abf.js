const handleSearch = (e) => {
  const search = $('form[role="search"] input').val()
  e.preventDefault();
    // baseURL declared in head.html
    window.location.href = `${baseURL}search-results/index.html?search=${encodeURIComponent(DOMPurify.sanitize(search))}`;
}

$('form[role="search"] .btn-primary').on('click', (e) => {
  handleSearch(e);
})

$("#global-search").on('show.bs.collapse', function () {
  $(this).keypress(function(e){
    if (e.keyCode == 13) {
      handleSearch(e);
      return false;
    }
  })
});

