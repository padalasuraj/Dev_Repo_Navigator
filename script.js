document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("search-button")
    .addEventListener("click", function () {
      const username = document.getElementById("search-input").value;
      if (username) {
        fetchUserData(username);
        fetchUserRepos(username, 1);
      }
    });
});

function fetchUserData(username) {
  fetch(`https://api.github.com/users/${username}`, { mode: "cors" })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.statusText}`);
      }
      return response.json();
    })
    .then((user) => {
      displayUserData(user);
    })
    .catch((error) => console.error(error));
}

function fetchUserRepos(username, page) {
  fetch(
    `https://api.github.com/users/${username}/repos?per_page=10&page=${page}`,
    { mode: "cors" }
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch repos: ${response.statusText}`);
      }
      return Promise.all([response.json(), response.headers]);
    })
    .then(([repos, headers]) => {
      displayUserRepos(repos);
      setupPagination(username, page, headers.get("Link"));
    })
    .catch((error) => console.error(error));
}

function displayUserData(user) {
  const profileContainer = document.getElementById("profile-container");
  const githubLink = user.html_url;
  const bio = user.bio || "N/A";
  const twitterHandle = user.twitter_username || "N/A";

  profileContainer.innerHTML = `
        <div id="profile">
            <img id="avatar" src="${user.avatar_url}" alt="Profile Image">
            <div id="user-details">
                <h1>${user.login}</h1>
                <p>Bio: ${bio}</p>
                <p>Twitter: ${twitterHandle}</p>
                <p> <i class="material-icons" style="font-size:26px">location_on</i> Location: ${
                  user.location || "N/A"
                }</p>
                <p class="gitlink"><a href="${githubLink}" target="_blank">&#128279; ${githubLink}</a></p>
            </div>
        </div>
    `;
}

function displayUserRepos(repos) {
  const reposContainer = document.getElementById("repos-container");
  reposContainer.innerHTML = "";
  repos.forEach((repo) => {
    const repoElement = document.createElement("div");
    repoElement.className = "repo-card";
    repoElement.innerHTML = `
            <h2 class="repo-name">${repo.name}</h2>
            <p class="repo-description">${
              repo.description || "No description"
            }</p>
            <a href="${repo.html_url}" target="_blank">View Repository</a>
            <div class="tags">
                ${
                  repo.language
                    ? `<span class="tag">${repo.language}</span>`
                    : ""
                }
            </div>
        `;
    reposContainer.appendChild(repoElement);
  });
}

function setupPagination(username, currentPage, linkHeader) {
  const paginationContainer = document.getElementById("pagination-container");
  paginationContainer.innerHTML = "";
  const links = parseLinkHeader(linkHeader);

  if (links.prev) {
    const prevButton = document.createElement("button");
    prevButton.textContent = "Previous";
    prevButton.onclick = () => fetchUserRepos(username, currentPage - 1);
    paginationContainer.appendChild(prevButton);
  }

  const pageIndicator = document.createElement("span");
  pageIndicator.textContent = `Page ${currentPage}`;
  paginationContainer.appendChild(pageIndicator);

  if (links.next) {
    const nextButton = document.createElement("button");
    nextButton.textContent = "Next";
    nextButton.onclick = () => fetchUserRepos(username, currentPage + 1);
    paginationContainer.appendChild(nextButton);
  }
}

function parseLinkHeader(header) {
  if (!header || header.length === 0) {
    return {};
  }
  const parts = header.split(",").map((part) => part.split(";"));
  const links = {};
  parts.forEach((p) => {
    const section = p[0].split("=");
    const url = section[1].replace(/<(.*)>/, "$1").trim();
    const name = section[2].replace(/rel="(.*)"/, "$1").trim();
    links[name] = url;
  });
  return links;
}
