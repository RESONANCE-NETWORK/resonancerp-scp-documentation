const skippedCategories = ["manual"];

class Node
{
	constructor(name, element, expandable, noAutoCollapse, children = [])
	{
		this.name = name;
		this.element = element;
		this.expandable = expandable;
		this.noAutoCollapse = noAutoCollapse;
		this.children = children;
	}

	AddChild(name, element, expandable, noAutoCollapse, children)
	{
		let newNode = new Node(name, element, expandable, noAutoCollapse, children);
		this.children.push(newNode);

		return newNode;
	}
}

class SearchManager
{
	constructor(input, contents)
	{
		this.input = input;
		this.input.addEventListener("input", event =>
		{
			this.OnInputUpdated(this.input.value.toLowerCase().replace(/:/g, "."));
		});

		this.tree = new Node("", document.createElement("null"), true, true);
		this.entries = {};

		const categoryElements = contents.querySelectorAll(".category");

		for (const category of categoryElements)
		{
			const nameElement = category.querySelector(":scope > summary > h2");

			if (!nameElement)
			{
				continue;
			}

			const categoryName = nameElement.textContent.trim().toLowerCase();

			if (skippedCategories.includes(categoryName))
			{
				continue;
			}

			let categoryNode = this.tree.AddChild(categoryName, category, true, true);
			const sectionElements = category.querySelectorAll(":scope > ul > li");

			for (const section of sectionElements)
			{
				const entryElements = section.querySelectorAll(":scope > details > ul > li > a");
				const sectionName = section.querySelector(":scope > details > summary > a")
					.textContent
					.trim()
					.toLowerCase();

				let sectionNode = categoryNode.AddChild(sectionName, section.querySelector(":scope > details"), true);

				for (let i = 0; i < entryElements.length; i++)
				{
					const entryElement = entryElements[i];
					const entryName = entryElement.textContent.trim().toLowerCase();

					sectionNode.AddChild(sectionName + "." + entryName, entryElement.parentElement);
				}
			}
		}

		this.setupAnimations();
	}

	setupAnimations()
	{
		const allDetails = document.querySelectorAll("details");
		
		allDetails.forEach(details => {
			const summary = details.querySelector("summary");
			const content = details.querySelector("ul");
			
			if (!summary || !content) return;

			const link = summary.querySelector("a");
			
			summary.addEventListener("click", (e) => {
				if (e.target === link || link.contains(e.target)) {
					return;
				}
				
				e.preventDefault();
				this.toggleDetails(details, content);
			});

			if (!details.open) {
				content.style.maxHeight = "0px";
				content.style.overflow = "hidden";
				content.style.opacity = "0";
			} else {
				content.style.maxHeight = "none";
				content.style.overflow = "visible";
				content.style.opacity = "1";
			}
		});
	}

	toggleDetails(details, content)
	{
		if (details.open) {
			const startHeight = content.scrollHeight;
			content.style.maxHeight = startHeight + "px";
			content.style.overflow = "hidden";
			
			requestAnimationFrame(() => {
				content.style.transition = "max-height 0.3s ease-out, opacity 0.2s ease-out";
				content.style.maxHeight = "0px";
				content.style.opacity = "0";
			});

			setTimeout(() => {
				details.open = false;
			}, 300);
		} else {
			details.open = true;
			content.style.overflow = "hidden";
			content.style.maxHeight = "0px";
			content.style.opacity = "0";
			
			const endHeight = content.scrollHeight;
			
			requestAnimationFrame(() => {
				content.style.transition = "max-height 0.3s ease-out, opacity 0.2s ease-out";
				content.style.maxHeight = endHeight + "px";
				content.style.opacity = "1";
			});

			setTimeout(() => {
				content.style.overflow = "visible";
			}, 300);
		}
	}

	ResetVisibility(current)
	{
		current.element.style.display = "";

		if (current.noAutoCollapse)
		{
			current.element.open = true;
			const content = current.element.querySelector("ul");
			if (content) {
				content.style.maxHeight = "none";
				content.style.opacity = "1";
				content.style.overflow = "visible";
			}
		}
		else if (current.expandable)
		{
			current.element.open = false;
			const content = current.element.querySelector("ul");
			if (content) {
				content.style.maxHeight = "0px";
				content.style.opacity = "0";
				content.style.overflow = "hidden";
			}
		}

		for (let node of current.children)
		{
			this.ResetVisibility(node);
		}
	}

	Search(input, current)
	{
		let matched = false;

		if (current.name.indexOf(input) != -1)
		{
			matched = true;
		}

		for (let node of current.children)
		{
			let childMatched = this.Search(input, node);
			matched = matched || childMatched;
		}

		if (matched)
		{
			current.element.style.display = "";

			if (current.expandable)
			{
				current.element.open = true;
				const content = current.element.querySelector("ul");
				if (content) {
					content.style.maxHeight = "none";
					content.style.opacity = "1";
					content.style.overflow = "visible";
				}
			}
		}
		else
		{
			current.element.style.display = "none";

			if (current.expandable)
			{
				current.element.open = false;
				const content = current.element.querySelector("ul");
				if (content) {
					content.style.maxHeight = "0px";
					content.style.opacity = "0";
					content.style.overflow = "hidden";
				}
			}
		}

		return matched;
	}

	OnInputUpdated(input)
	{
		if (input.length <= 1)
		{
			this.ResetVisibility(this.tree);
			return;
		}

		this.Search(input, this.tree);
	}
}

window.onload = function()
{
	const openDetails = document.querySelector(".category > ul > li > details[open]");

	if (openDetails)
	{
		openDetails.scrollIntoView();
	}
}

document.addEventListener("DOMContentLoaded", function()
{
	const searchInput = document.getElementById("search");
	const contents = document.querySelector("body > main > nav > section");

	if (searchInput && contents)
	{
		new SearchManager(searchInput, contents);
	}
});