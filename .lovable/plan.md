# Fix the storefront display

## Changes
- Remove the development page-tagging plug-in that is injecting invalid React references and flooding the page with render warnings.
- Simplify the phone header so its key controls fit cleanly; keep wishlist and order history available in the menu.
- Verify the home page at phone and desktop sizes, including blank-screen errors and horizontal overflow.

## Technical details
- Keep React dependency deduplication in place.
- Do not change store content, product data, routes, or backend behavior.
