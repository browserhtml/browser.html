/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

use std::env;
use std::process::Command;
use std::path::PathBuf;

fn main() {
    let out_dir = env::var("OUT_DIR").unwrap();
    let target = env::var("TARGET").unwrap();

    if target.contains("windows") {
        // sigh
        let mut css_dir = PathBuf::from(&out_dir);
        css_dir.push("css");
        let mut components_dir = PathBuf::from(&out_dir);
        components_dir.push("components");
        assert!(Command::new("xcopy")
                .args(&["/QY", "index.html", &out_dir])
                .status()
                .unwrap()
                .success());
        assert!(Command::new("xcopy")
                .args(&["/EQIY", "components", components_dir.to_str().unwrap()])
                .status()
                .unwrap()
                .success());
        assert!(Command::new("xcopy")
                .args(&["/EQIY", "css", css_dir.to_str().unwrap()])
                .status()
                .unwrap()
                .success());
    } else {
        assert!(Command::new("cp")
                .args(&["-R", "index.html", "css", "components", &out_dir])
                .status()
                .unwrap()
                .success());
    }
}
