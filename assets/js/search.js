const handleSearch = (e) => {
  const search = $('form[role="search"] input').val()
  e.preventDefault();
  if (search.length > 2) {
    window.location.href = `/ehs-data-portal-frontend-temp/search_results/index.html?search=${search}`;
  }
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

