/// @title Portfolio Manager with 7 Fields
/// @notice Stores complete portfolio data on-chain

module portfolio::portfolio {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use std::string::String;

    /// Portfolio with 7 fields
    public struct Portfolio has key, store {
        id: UID,
        name: String,
        course: String,
        school: String,
        about: String,
        linkedin_url: String,
        github_url: String,
        skills: vector<String>,
    }

    /// Event emitted when portfolio is created
    public struct PortfolioCreated has copy, drop {
        object_id: ID,
        name: String,
        owner: address,
    }

    /// Event emitted when portfolio is updated
    public struct PortfolioUpdated has copy, drop {
        object_id: ID,
        name: String,
        updater: address,
    }

    /// Create new portfolio with 7 fields
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
        let sender = tx_context::sender(ctx);
        let portfolio = Portfolio {
            id: object::new(ctx),
            name: copy name,
            course: copy course,
            school: copy school,
            about: copy about,
            linkedin_url: copy linkedin_url,
            github_url: copy github_url,
            skills: copy skills,
        };
        
        let object_id = object::id(&portfolio);
        transfer::share_object(portfolio);
        
        event::emit(PortfolioCreated {
            object_id,
            name,
            owner: sender,
        });
    }

    /// **NEW: Update existing portfolio**
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
        let sender = tx_context::sender(ctx);
        
        portfolio.name = name;
        portfolio.course = course;
        portfolio.school = school;
        portfolio.about = about;
        portfolio.linkedin_url = linkedin_url;
        portfolio.github_url = github_url;
        portfolio.skills = skills;
        
        let object_id = object::id(portfolio);
        
        event::emit(PortfolioUpdated {
            object_id,
            name: portfolio.name,
            updater: sender,
        });
    }

    /// Get portfolio name
    public fun get_name(portfolio: &Portfolio): &String {
        &portfolio.name
    }

    /// Get portfolio course
    public fun get_course(portfolio: &Portfolio): &String {
        &portfolio.course
    }

    /// Get portfolio school
    public fun get_school(portfolio: &Portfolio): &String {
        &portfolio.school
    }

    /// Get portfolio about
    public fun get_about(portfolio: &Portfolio): &String {
        &portfolio.about
    }

    /// Get LinkedIn URL
    public fun get_linkedin_url(portfolio: &Portfolio): &String {
        &portfolio.linkedin_url
    }

    /// Get GitHub URL
    public fun get_github_url(portfolio: &Portfolio): &String {
        &portfolio.github_url
    }

    /// Get skills
    public fun get_skills(portfolio: &Portfolio): &vector<String> {
        &portfolio.skills
    }

    /// Get all portfolio data (view function)
    public fun get_all_data(portfolio: &Portfolio): (
        &String,
        &String,
        &String,
        &String,
        &String,
        &String,
        &vector<String>
    ) {
        (
            &portfolio.name,
            &portfolio.course,
            &portfolio.school,
            &portfolio.about,
            &portfolio.linkedin_url,
            &portfolio.github_url,
            &portfolio.skills
        )
    }
}