/// @title Portfolio Manager
/// @notice A smart contract for managing on-chain portfolio data

module portfolio::portfolio {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::String;

    /// Error codes
    const ENotOwner: u64 = 0;

    /// Portfolio data structure
    struct Portfolio has key, store {
        id: UID,
        owner: address,
        name: String,
        course: String,
        school: String,
        about: String,
        linkedin_url: String,
        github_url: String,
        skills: vector<String>,
        views: u64,
        created_at: u64,
        updated_at: u64
    }

    // === Public Functions ===

    /// Create a new portfolio
    public fun create(
        name: String,
        course: String,
        school: String,
        about: String,
        linkedin_url: String,
        github_url: String,
        skills: vector<String>,
        ctx: &mut TxContext
    ) {
        let portfolio = Portfolio {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            name,
            course,
            school,
            about,
            linkedin_url,
            github_url,
            skills,
            views: 0,
            created_at: tx_context::epoch(ctx),
            updated_at: tx_context::epoch(ctx)
        };

        transfer::share_object(portfolio);
    }

    /// Update portfolio data (only owner can update)
    public fun update(
        portfolio: &mut Portfolio,
        name: String,
        course: String,
        school: String,
        about: String,
        linkedin_url: String,
        github_url: String,
        skills: vector<String>,
        ctx: &mut TxContext
    ) {
        assert!(portfolio.owner == tx_context::sender(ctx), ENotOwner);

        portfolio.name = name;
        portfolio.course = course;
        portfolio.school = school;
        portfolio.about = about;
        portfolio.linkedin_url = linkedin_url;
        portfolio.github_url = github_url;
        portfolio.skills = skills;
        portfolio.updated_at = tx_context::epoch(ctx);
    }

    /// Increment view count
    public fun increment_views(portfolio: &mut Portfolio) {
        portfolio.views = portfolio.views + 1;
    }

    /// Transfer portfolio ownership
    public fun transfer_ownership(
        portfolio: &mut Portfolio,
        new_owner: address,
        ctx: &mut TxContext
    ) {
        assert!(portfolio.owner == tx_context::sender(ctx), ENotOwner);
        portfolio.owner = new_owner;
    }

    // === View Functions ===

    /// Get portfolio owner
    public fun owner(portfolio: &Portfolio): address {
        portfolio.owner
    }

    /// Get portfolio name
    public fun name(portfolio: &Portfolio): &String {
        &portfolio.name
    }

    /// Get course
    public fun course(portfolio: &Portfolio): &String {
        &portfolio.course
    }

    /// Get school
    public fun school(portfolio: &Portfolio): &String {
        &portfolio.school
    }

    /// Get about section
    public fun about(portfolio: &Portfolio): &String {
        &portfolio.about
    }

    /// Get LinkedIn URL
    public fun linkedin_url(portfolio: &Portfolio): &String {
        &portfolio.linkedin_url
    }

    /// Get GitHub URL
    public fun github_url(portfolio: &Portfolio): &String {
        &portfolio.github_url
    }

    /// Get skills list
    public fun skills(portfolio: &Portfolio): &vector<String> {
        &portfolio.skills
    }

    /// Get view count
    public fun views(portfolio: &Portfolio): u64 {
        portfolio.views
    }

    /// Get creation timestamp
    public fun created_at(portfolio: &Portfolio): u64 {
        portfolio.created_at
    }

    /// Get last update timestamp
    public fun updated_at(portfolio: &Portfolio): u64 {
        portfolio.updated_at
    }
}