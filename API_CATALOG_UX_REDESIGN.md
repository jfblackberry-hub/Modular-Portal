# API Catalog UX Redesign

## Problems in the Original Layout

The original API Catalog workspace had the right data but the wrong interaction model.

Main problems:

- too many controls were visible at once
- search, filters, sorting, tags, and chips competed with the catalog itself
- the top of the page felt like an admin control wall instead of a curated catalog
- the default experience read like metadata management, not discovery
- the detail panel felt bolted on and visually secondary
- table mode dominated the experience instead of supporting it
- the page felt cramped and overly bordered

## Design Goals

The redesign shifts the page toward an API catalog explorer with:

- browsing-first interaction
- category-led discovery
- fewer visible controls by default
- stronger visual hierarchy
- cleaner spacing and more breathing room
- a richer catalog-card experience as the default
- a deliberate slide-out detail experience
- operational table mode kept as a secondary view

## Changes Made

### New browse model

The page now opens as a catalog explorer with this structure:

1. Hero / header region
2. Lightweight summary strip
3. Category browsing rail
4. Compact toolbar
5. Catalog results
6. Detail drawer

### Header changes

The header now provides:

- strong page title
- concise subtitle
- one prominent search bar
- small intentional summary stats

### Filter model

Visible by default:

- search
- category selection
- vendor selector
- implementation status selector
- sort selector
- view mode toggle

Advanced filters moved into a dedicated drawer:

- auth type
- AWS relevance
- strategic priority
- tenant configurability
- quick tags

This removes the giant filter wall and keeps the catalog itself as the focal point.

### View modes

Default:

- Catalog view using curated cards

Secondary:

- Table view for operational scanning

The selected view mode is stored in local storage for return visits.

### Detail experience

The old side panel was replaced with a proper slide-out detail drawer that presents:

- vendor and platform
- API name
- description
- category and status badges
- readiness and documentation state
- supported modules
- auth methods
- integration patterns
- standards
- AWS planning context
- tenant enablement notes
- future opportunities

## New Browse Model

The page now supports discovery in this order:

1. Search by keyword
2. Browse by major category
3. Narrow with lightweight toolbar controls
4. Open details when an entry becomes interesting
5. Use advanced filters only when needed

This makes the page useful for both business and technical users without forcing everyone through a dense admin filter experience first.

## Future Enhancement Ideas

- featured collections such as “Most Strategic” or “AWS Migration Focus”
- saved views per admin user
- richer vendor logos and marketplace visuals
- dedicated full-page detail routes
- tenant enablement indicators tied to live connector templates
- documentation links and owner/team assignment
- live deployment/health rollups from applied integrations
