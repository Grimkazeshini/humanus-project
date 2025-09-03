
Debian
====================
This directory contains files used to package humanusd/humanus-qt
for Debian-based Linux systems. If you compile humanusd/humanus-qt yourself, there are some useful files here.

## humanus: URI support ##


humanus-qt.desktop  (Gnome / Open Desktop)
To install:

	sudo desktop-file-install humanus-qt.desktop
	sudo update-desktop-database

If you build yourself, you will either need to modify the paths in
the .desktop file or copy or symlink your humanusqt binary to `/usr/bin`
and the `../../share/pixmaps/humanus128.png` to `/usr/share/pixmaps`

humanus-qt.protocol (KDE)

